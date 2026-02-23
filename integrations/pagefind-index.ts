import { promises as fs } from 'node:fs';
import { join, relative } from 'node:path';
import type { AstroIntegration } from 'astro';
import { load } from 'cheerio';
import * as pagefind from 'pagefind';

const HIDDEN_PATH_PREFIXES = ['enterprise'];

const isHiddenPath = (path: string): boolean => {
  return HIDDEN_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
};

/**
 * Build a synthetic HTML document for a single search record.
 *
 * Pagefind parses this HTML and applies `data-pagefind-weight` per element:
 *   - title  → weight 7  (matches Pagefind's default h1 weight)
 *   - properties (inline code terms) → weight 5
 *   - body text → weight 1 (default)
 *   - changelog body → weight 0.5 (demoted)
 *
 * The `data-pagefind-meta` attributes let us pass custom metadata (pageTitle)
 * that the search client can read from `result.meta`.
 */
function buildRecordHtml(opts: {
  title: string;
  body: string;
  properties: string[];
  pageTitle?: string;
  headingPath?: string[];
  isChangelog: boolean;
}): string {
  const { title, body, properties, pageTitle, headingPath, isChangelog } = opts;
  const bodyWeight = isChangelog ? '0.5' : '1';

  const propsHtml =
    properties.length > 0
      ? `<p data-pagefind-weight="5">${escapeHtml(properties.join(' '))}</p>`
      : '';

  const metaParts: string[] = [];
  if (pageTitle) metaParts.push(`pageTitle:${escapeAttr(pageTitle)}`);
  if (headingPath && headingPath.length > 0)
    metaParts.push(`headingPath:${escapeAttr(headingPath.join(' > '))}`);
  const metaAttr = metaParts.length > 0 ? ` data-pagefind-meta="${metaParts.join(', ')}"` : '';

  return [
    '<html lang="en">',
    `<body${metaAttr}>`,
    `<h1 data-pagefind-weight="7">${escapeHtml(title)}</h1>`,
    propsHtml,
    `<div data-pagefind-weight="${bodyWeight}">${escapeHtml(body)}</div>`,
    '</body></html>',
  ].join('');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function PagefindIndex(): AstroIntegration {
  return {
    name: 'pagefind-index',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const distRoot = dir?.pathname ?? join(process.cwd(), 'dist');

        const { index } = await pagefind.createIndex({});
        if (!index) {
          console.error('[Pagefind] Failed to create index');
          return;
        }

        const htmlFiles = await listHtmlFiles(distRoot);
        let recordCount = 0;

        for (const filePath of htmlFiles) {
          const html = await fs.readFile(filePath, 'utf8');
          const $ = load(html);

          const canonicalHref = $('link[rel="canonical"]').attr('href') || '';
          const baseUrl = toUrlFromCanonical(canonicalHref) || toUrlFromPath(distRoot, filePath);

          if (isHiddenPath(baseUrl)) continue;

          const pageTitle =
            $('meta[property="og:title"]').attr('content') || $('title').text() || '';

          const isChangelog = baseUrl.startsWith('changelog');

          let main = $('main article');
          if (main.length === 0) main = $('article');
          if (main.length === 0) main = $('main');
          if (main.length === 0) main = $('body');

          const pageDescription =
            $('meta[name="description"]').attr('content') ||
            $('meta[property="og:description"]').attr('content') ||
            '';

          // Page-level record (intro content before first heading)
          const intro = extractIntro(main, $);
          const introBody = [intro.text, pageDescription].filter(Boolean).join(' ');
          if (introBody) {
            const properties = extractProperties(intro.html, $);
            const recordHtml = buildRecordHtml({
              title: pageTitle,
              body: introBody,
              properties,
              isChangelog,
            });
            await index.addHTMLFile({
              url: `/${baseUrl}/`,
              content: recordHtml,
            });
            recordCount++;
          }

          // Heading-level records
          const sections = extractSections(main, $);
          for (const section of sections) {
            const properties = extractProperties(section.html, $);
            const recordHtml = buildRecordHtml({
              title: section.heading,
              body: section.text,
              properties,
              pageTitle,
              headingPath: section.headingPath,
              isChangelog,
            });
            await index.addHTMLFile({
              url: `/${baseUrl}/#${section.anchor}`,
              content: recordHtml,
            });
            recordCount++;
          }
        }

        console.info(`[Pagefind] Indexed ${recordCount} records from ${htmlFiles.length} pages`);

        await index.writeFiles({
          outputPath: join(distRoot, 'pagefind'),
        });
        console.info(`[Pagefind] Wrote index to ${join(distRoot, 'pagefind')}`);

        await pagefind.close();
      },
    },
  };
}

interface Section {
  anchor: string;
  heading: string;
  text: string;
  html: string;
  headingPath: string[];
}

/** Extract inline code terms (not inside <pre>) that look like property/config names. */
function extractProperties(sectionHtml: string, $: any): string[] {
  const properties = new Set<string>();
  const fragment = $(`<div>${sectionHtml}</div>`);

  fragment.find('code').each((_: number, el: any) => {
    const $code = $(el);
    if ($code.closest('pre').length > 0) return;

    const text = $code.text().trim();
    if (text.length >= 2 && text.length <= 80) {
      if (
        /^[a-z_][a-z0-9_.-]*$/i.test(text) || // snake_case, dot.notation, kebab-case
        /^[a-z][a-zA-Z0-9]*$/.test(text) // camelCase
      ) {
        properties.add(text.toLowerCase());
      }
    }
  });

  return Array.from(properties);
}

function extractIntro(main: any, $: any): { text: string; html: string } {
  const textParts: string[] = [];
  const htmlParts: string[] = [];

  main.children().each((_: number, el: any) => {
    if ($(el).is('h1, h2, h3, h4, h5, h6')) return false;
    if ($(el).hasClass('heading-wrapper')) return false;

    if ($(el).is('p, ul, ol, pre, blockquote, div, section, table')) {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text) textParts.push(text);
      const h = $.html(el);
      if (h) htmlParts.push(h);
    }
  });

  return { text: textParts.join(' '), html: htmlParts.join('\n') };
}

function extractSections(main: any, $: any): Section[] {
  const sections: Section[] = [];
  const allHeadings = main.find('h2, h3, h4').toArray();
  const headingStack: Array<{ text: string; level: number }> = [];

  for (let i = 0; i < allHeadings.length; i++) {
    const el = allHeadings[i];
    const $el = $(el);
    const id = $el.attr('id');
    if (!id || id === 'on-this-page-heading') continue;

    const headingText = $el.text().trim();
    if (!headingText) continue;

    const tag = el.tagName.toLowerCase();
    const level = Number.parseInt(tag.replace('h', ''), 10);
    const stopTags = Array.from({ length: level }, (_, j) => `h${j + 1}`).join(', ');

    // Maintain heading stack for hierarchy breadcrumbs
    while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
      headingStack.pop();
    }
    headingStack.push({ text: headingText, level });

    const $wrapper = $el.parent();
    const $startElement = $wrapper.hasClass('heading-wrapper') ? $wrapper : $el;

    const textParts: string[] = [headingText];
    const htmlParts: string[] = [$.html($startElement)];
    let $current = $startElement.next();
    while ($current.length) {
      if ($current.is(stopTags)) break;
      if ($current.hasClass('heading-wrapper')) {
        const headingInWrapper = $current.find(stopTags);
        if (headingInWrapper.length) break;
      }
      const text = $current.text().replace(/\s+/g, ' ').trim();
      if (text) textParts.push(text);
      const h = $.html($current);
      if (h) htmlParts.push(h);
      $current = $current.next();
    }

    sections.push({
      anchor: id,
      heading: headingText,
      text: textParts.join(' '),
      html: htmlParts.join('\n'),
      headingPath: headingStack.map((h) => h.text),
    });
  }

  return sections;
}

async function listHtmlFiles(
  root: string,
  current: string = root,
  acc: string[] = []
): Promise<string[]> {
  const dirents = await fs.readdir(current, { withFileTypes: true });
  for (const d of dirents) {
    const full = join(current, d.name);
    if (d.isDirectory()) {
      if (d.name === '_astro' || d.name === 'pagefind') continue;
      acc = await listHtmlFiles(root, full, acc);
    } else if (d.isFile()) {
      if (d.name.endsWith('.html')) acc.push(full);
    }
  }
  return acc;
}

function toUrlFromCanonical(canonical: string | undefined | null): string | null {
  if (!canonical) return null;
  try {
    const url = new URL(canonical);
    let p = url.pathname;
    if (p.startsWith('/')) p = p.slice(1);
    if (p.endsWith('index.html')) p = p.slice(0, -'index.html'.length);
    if (p.endsWith('/')) p = p.slice(0, -1);
    return p;
  } catch {
    return null;
  }
}

function toUrlFromPath(root: string, filePath: string): string {
  let rel = relative(root, filePath).replace(/\\/g, '/');
  if (rel.endsWith('index.html')) rel = rel.slice(0, -'index.html'.length);
  if (rel.endsWith('/')) rel = rel.slice(0, -1);
  return rel;
}
