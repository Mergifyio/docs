import { promises as fs } from 'node:fs';
import { join, relative } from 'node:path';
import { algoliasearch } from 'algoliasearch';
import type { AstroIntegration } from 'astro';
import { load } from 'cheerio';

export interface PageData {
  headings: Array<{ value: string; depth: number }>;
  tables: any[];
  objectID: string;
  excerpt: string;
  title: string;
  description: string;
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

        let pages: PageData[] = [];

        const distRoot = dir?.pathname ?? join(process.cwd(), 'dist');
        pages = await collectPagesFromDist(distRoot);
        console.info(`[Algolia] collected pages from dist: ${pages.length}`);
        if (pages.length === 0) {
          return;
        }

        const client = algoliasearch(appId, writeKey) as any;
        await client.replaceAllObjects({ indexName, objects: pages, safe: true });
        console.info('[Algolia] Index updated.');
      },
    },
  };
}

async function collectPagesFromDist(distRoot: string): Promise<PageData[]> {
  const htmlFiles = await listHtmlFiles(distRoot);
  const pages: PageData[] = [];

  for (const filePath of htmlFiles) {
    const html = await fs.readFile(filePath, 'utf8');
    const $ = load(html);

    // Prefer canonical URL to compute stable objectID
    const canonicalHref = $('link[rel="canonical"]').attr('href') || '';
    const objectId =
      toObjectIdFromCanonical(canonicalHref) || toObjectIdFromPath(distRoot, filePath);

    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    const description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      '';

    const main = $('main');
    const headings: { value: string; depth: number }[] = [];
    const seen = new Set<string>();
    main
      .find('article h1, article h2, article h3, article h4, article h5, article h6')
      .each((_, el) => {
        const id = $(el).attr('id');
        if (id === 'on-this-page-heading') return; // skip TOC headings
        const tag = el.tagName.toLowerCase();
        const depth = Number(tag.replace('h', '')) || 1;
        const value = $(el).text().trim();
        if (!value) return;
        const key = `${depth}:${value}`;
        if (seen.has(key)) return;
        seen.add(key);
        headings.push({ value, depth });
      });

    const excerptParts: string[] = [];
    main.find('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text) excerptParts.push(text);
    });

    const tables: Array<{ node: string; data: string | null; content: string | null }> = [];
    main.find('table').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      // Keep the same shape as remark mode: node is a JSON string
      const nodeJson = JSON.stringify({ name: 'Table' });
      tables.push({ node: nodeJson, data: null, content: text || null });
    });

    pages.push({
      objectID: objectId,
      title,
      description,
      headings,
      tables,
      excerpt: excerptParts.join(' '),
    });
  }
  return pages;
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

function toObjectIdFromCanonical(canonical: string | undefined | null): string | null {
  if (!canonical) return null;
  try {
    const url = new URL(canonical);
    let p = url.pathname; // e.g. /workflow/rebase/
    if (p.startsWith('/')) p = p.slice(1);
    if (p.endsWith('index.html')) p = p.slice(0, -'index.html'.length);
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
  return rel;
}
