import { promises as fs } from 'node:fs';
import { join, relative } from 'node:path';
import { algoliasearch } from 'algoliasearch';
import type { AstroIntegration } from 'astro';
import { load } from 'cheerio';
import type { AlgoliaRecord } from '../src/components/Search/types';

interface Heading {
  anchor: string;
  heading: string;
  level: 1 | 2 | 3;
  html: string;
  headingPath: string[];
}
export function AlgoliaUpdateIndex(): AstroIntegration {
  return {
    name: 'algolia-update-index',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const appId = process.env.PUBLIC_ALGOLIA_APP_ID;
        const writeKey = process.env.ALGOLIA_WRITE_KEY;
        const indexName = process.env.PUBLIC_ALGOLIA_INDEX_NAME;

        if (!appId || !writeKey || !indexName) {
          console.info('[Algolia] missing env, skip replaceAll');
          return;
        }

        const distRoot = dir?.pathname ?? join(process.cwd(), 'dist');
        const records = await collectPagesFromDist(distRoot);
        console.info(`[Algolia] collected ${records.length} records from dist`);
        if (records.length === 0) {
          return;
        }

        const client = algoliasearch(appId, writeKey) as any;
        await client.replaceAllObjects({ indexName, objects: records, safe: true });
        console.info('[Algolia] Index updated with optimized records.');
      },
    },
  };
}

async function collectPagesFromDist(distRoot: string): Promise<AlgoliaRecord[]> {
  const htmlFiles = await listHtmlFiles(distRoot);
  const records: AlgoliaRecord[] = [];

  for (const filePath of htmlFiles) {
    const html = await fs.readFile(filePath, 'utf8');
    const $ = load(html);

    // Prefer canonical URL to compute stable objectID
    const canonicalHref = $('link[rel="canonical"]').attr('href') || '';
    const baseUrl =
      toObjectIdFromCanonical(canonicalHref) || toObjectIdFromPath(distRoot, filePath);

    const pageTitle = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    const pageDescription =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      '';
    const category = extractCategory(baseUrl, $);

    // Try multiple selectors to find the main content area
    let main = $('main article');
    if (main.length === 0) main = $('article');
    if (main.length === 0) main = $('main');
    if (main.length === 0) main = $('body');

    // Create page-level record with introduction content (no headings)
    const introHtml = extractIntroHtml(main, $);
    if (introHtml) {
      const introText = htmlToText(introHtml, $);
      const introProperties = extractProperties(introHtml, $);
      records.push({
        objectID: baseUrl,
        url: baseUrl,
        hierarchy: buildHierarchy(baseUrl, null),
        type: 'page',
        html: introHtml,
        text: introText,
        properties: introProperties,
        category,
        pageTitle,
        pageDescription,
      });
    }

    // Create H1, H2, H3 records (hierarchical, no nesting)
    const headings = extractHeadings(main, $);
    for (const heading of headings) {
      const headingId = `${baseUrl}#${heading.anchor}`;
      const headingType = `H${heading.level}` as 'H1' | 'H2' | 'H3';
      const headingText = htmlToText(heading.html, $);
      const headingProperties = extractProperties(heading.html, $);

      records.push({
        objectID: headingId,
        url: headingId,
        hierarchy: buildHierarchy(baseUrl, heading.headingPath),
        type: headingType,
        html: heading.html,
        text: headingText,
        properties: headingProperties,
        category,
        pageTitle,
        pageDescription,
      });
    }
  }

  return records;
}

async function listHtmlFiles(
  root: string,
  current: string = root,
  acc: string[] = []
): Promise<string[]> {
  const dirents = await fs.readdir(current, { withFileTypes: true });
  for (const d of dirents) {
    const full = join(current, d.name);
    // Skip Astro asset bundles
    if (d.isDirectory()) {
      if (d.name === '_astro') continue;
      acc = await listHtmlFiles(root, full, acc);
    } else if (d.isFile()) {
      if (d.name.endsWith('.html')) acc.push(full);
    }
  }
  return acc;
}

function htmlToText(html: string, $: any): string {
  // Parse the HTML and extract plain text
  const fragment = $(`<div>${html}</div>`);
  return fragment.text().replace(/\s+/g, ' ').trim();
}

function extractProperties(html: string, $: any): string[] {
  // Extract property names from inline code tags
  const properties = new Set<string>();
  const fragment = $(`<div>${html}</div>`);

  // Find all inline code tags (not in pre blocks)
  fragment.find('code').each((_: number, el: any) => {
    const $code = $(el);

    // Skip code blocks inside <pre>
    if ($code.closest('pre').length > 0) {
      return;
    }

    const text = $code.text().trim();

    // Filter for likely property names:
    // - Contains dots (e.g., pull_request.number)
    // - Contains underscores (e.g., merged_at)
    // - Contains hyphens (e.g., auto-merge)
    // - Is a single word identifier
    // - Length between 2 and 80 characters
    if (text.length >= 2 && text.length <= 80) {
      // Match common property patterns
      if (
        /^[a-z_][a-z0-9_.-]*$/i.test(text) || // snake_case, dot.notation, kebab-case
        /^[a-z][a-zA-Z0-9]*$/.test(text) // camelCase
      ) {
        properties.add(text);
      }
    }
  });

  return Array.from(properties);
}

function extractIntroHtml(main: any, $: any): string {
  // Get HTML content before the first h2 heading (introduction/overview section)
  const parts: string[] = [];

  main.children().each((_: number, el: any) => {
    // Stop at first H2 or any heading
    if ($(el).is('h1, h2, h3, h4, h5, h6')) {
      return false; // break
    }

    // Check if element is wrapped in heading-wrapper
    if ($(el).hasClass('heading-wrapper')) {
      return false; // break
    }

    // Collect HTML of non-heading content
    if ($(el).is('p, ul, ol, pre, blockquote, div, section, table')) {
      const html = $.html(el);
      if (html) parts.push(html);
    }
  });

  return parts.join('\n');
}

function extractHeadings(main: any, $: any): Heading[] {
  const headings: Heading[] = [];
  const headingStack: Array<{ text: string; level: number }> = [];

  // Get all h2, h3, h4 headings - we'll map h2->H1, h3->H2, h4->H3
  const allHeadings = main.find('h2, h3, h4').toArray();

  for (let i = 0; i < allHeadings.length; i++) {
    const el = allHeadings[i];
    const $el = $(el);
    const id = $el.attr('id');
    if (!id || id === 'on-this-page-heading') continue;

    const tag = el.tagName.toLowerCase();
    const originalLevel = Number.parseInt(tag.replace('h', ''), 10);
    // Map h2->1, h3->2, h4->3
    const mappedLevel = (originalLevel - 1) as 1 | 2 | 3;
    const headingText = $el.text().trim();
    if (!headingText) continue;

    // Update heading stack for hierarchy
    while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= mappedLevel) {
      headingStack.pop();
    }
    headingStack.push({ text: headingText, level: mappedLevel });

    // Find the next heading to determine boundaries
    const nextHeading = allHeadings[i + 1];

    // Determine what the next heading level should be to stop collecting content
    // For H1 (h2): stop at any h2
    // For H2 (h3): stop at h2 or h3
    // For H3 (h4): stop at h2, h3, or h4
    let stopSelector: string;
    if (mappedLevel === 1) {
      stopSelector = 'h2';
    } else if (mappedLevel === 2) {
      stopSelector = 'h2, h3';
    } else {
      stopSelector = 'h2, h3, h4';
    }

    // Extract HTML content between this heading and the next same/higher level heading
    const htmlParts: string[] = [];

    // Check if heading is wrapped in a div (Astro's heading-wrapper)
    const $wrapper = $el.parent();
    const $startElement = $wrapper.hasClass('heading-wrapper') ? $wrapper : $el;

    // Include the heading itself as HTML
    htmlParts.push($.html($startElement));

    // Get all elements between this heading and the next
    let $current = $startElement.next();
    while ($current.length) {
      // Stop if we hit the next heading of same or higher level
      if (nextHeading && $current[0] === nextHeading) {
        const nextTag = nextHeading.tagName.toLowerCase();
        const nextOriginalLevel = Number.parseInt(nextTag.replace('h', ''), 10);
        const nextMappedLevel = nextOriginalLevel - 1;
        if (nextMappedLevel <= mappedLevel) break;
      }

      // Stop if we hit any heading that's same or higher level
      if ($current.is(stopSelector)) break;
      if ($current.hasClass('heading-wrapper')) {
        const headingInWrapper = $current.find(stopSelector);
        if (headingInWrapper.length) break;
      }

      // Collect HTML
      const html = $.html($current);
      if (html) htmlParts.push(html);

      $current = $current.next();
    }

    headings.push({
      anchor: id,
      heading: headingText,
      level: mappedLevel,
      html: htmlParts.join('\n'),
      headingPath: headingStack.map((h) => h.text),
    });
  }

  return headings;
}

function buildHierarchy(url: string, headingPath: string[] | null): AlgoliaRecord['hierarchy'] {
  const parts = url.split('/').filter(Boolean);

  return {
    lvl0: parts[0] ? formatSlugToTitle(parts[0]) : null,
    lvl1: parts[1] ? formatSlugToTitle(parts[1]) : null,
    lvl2: headingPath?.[0] || null,
    lvl3: headingPath?.[1] || null,
  };
}

function formatSlugToTitle(slug: string): string {
  // Handle common acronyms that should stay uppercase
  const acronyms = new Set(['api', 'ci', 'ui', 'url', 'html', 'css', 'js']);

  return slug
    .split('-')
    .map((word) => {
      const lower = word.toLowerCase();
      return acronyms.has(lower)
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function extractCategory(url: string, $: any): string {
  // Try to extract category from page metadata first
  const ogSiteName = $('meta[property="og:site_name"]').attr('content');
  if (ogSiteName && ogSiteName !== 'Mergify Docs') {
    return ogSiteName;
  }

  // Fallback to first URL segment formatted as title
  const firstSegment = url.split('/')[0];
  return firstSegment ? formatSlugToTitle(firstSegment) : 'Documentation';
}

function toObjectIdFromCanonical(canonical: string | undefined | null): string | null {
  if (!canonical) return null;
  try {
    const url = new URL(canonical);
    let p = url.pathname; // e.g. /workflow/rebase/
    if (p.startsWith('/')) p = p.slice(1);
    if (p.endsWith('index.html')) p = p.slice(0, -'index.html'.length);
    if (p.endsWith('/')) p = p.slice(0, -1);
    return p;
  } catch {
    return null;
  }
}

function toObjectIdFromPath(root: string, filePath: string): string {
  // Convert dist absolute file path to a site-relative path without leading slash
  let rel = relative(root, filePath).replace(/\\/g, '/');
  if (rel.endsWith('index.html')) {
    rel = rel.slice(0, -'index.html'.length);
  }
  if (rel.endsWith('/')) {
    rel = rel.slice(0, -1);
  }
  return rel;
}
