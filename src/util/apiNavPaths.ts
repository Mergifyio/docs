// Node-only: reads the hand-written /api pages from disk. Kept out of
// navItems.tsx itself so components can keep importing the nav tree without
// dragging node:fs into a client bundle.
import { readdirSync } from 'node:fs';
import { groupByTag, type OpenAPISpec, slugifyTag } from '~/components/ApiReference/openapi';
import navItems, { type NavItem } from '~/content/navItems';
import { flattenNavItems } from '~/util/flattenNavItems';

const API_DOCS_URL = new URL('../content/docs/api/', import.meta.url);

/**
 * The slugs of the pages written by hand under `src/content/docs/api/`,
 * mirroring the glob the docs collection loads them with
 * (src/content.config.ts): recursive, and `_`-prefixed partials excluded,
 * because those never become routes.
 */
function handwrittenApiPages(): Set<string> {
  return new Set(
    readdirSync(API_DOCS_URL, { recursive: true, encoding: 'utf8' })
      .filter((name) => name.endsWith('.mdx'))
      .map((name) => name.replace(/\.mdx$/, ''))
      .filter((slug) => !slug.split('/').some((segment) => segment.startsWith('_')))
  );
}

/**
 * The `/api/*` sidebar links that resolve to nothing.
 *
 * Everything under `/api/` is either generated from an OpenAPI tag by
 * `src/pages/api/[tag].astro` — handed the same preprocessed schema here, and
 * grouped and slugified by the same helpers, so the two cannot disagree about
 * which routes exist — or a page written by hand under
 * `src/content/docs/api/`. A path matching neither is a 404 on every page of
 * the site, since the sidebar renders site-wide.
 */
export function danglingApiNavPaths(schema: OpenAPISpec, items: NavItem[] = navItems): string[] {
  const generated = new Set([...groupByTag(schema).keys()].map(slugifyTag));
  const handwritten = handwrittenApiPages();

  const dangling = flattenNavItems(items)
    .flatMap((item) => (item.path && /^\/api(\/|$)/.test(item.path) ? [item.path] : []))
    .filter((path) => {
      // A nav path may carry an anchor or query onto an otherwise real page.
      const slug = path
        .replace(/[#?].*$/, '')
        .replace(/^\/api\/?/, '')
        .replace(/\/$/, '');
      // `/api` itself is the reference index, src/pages/api/index.astro.
      if (slug === '') return false;
      return !generated.has(slug) && !handwritten.has(slug);
    });
  return [...new Set(dangling)].sort();
}
