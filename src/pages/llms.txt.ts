import type { CollectionEntry } from 'astro:content';
import { allPages } from '~/content';
import navItems from '~/content/navItems';

/**
 * Auto-generated list of documentation pages for LLM consumption.
 * Uses the navigation structure (navItems) as the single source of truth for ordering & inclusion.
 */
export const GET = async () => {
  const site = import.meta.env.SITE;
  const projectName = 'Mergify';
  const summary =
    'Documentation for Mergify: automate merges, manage merge queues, enforce policies, provide CI observability and telemetry, and streamline GitHub workflows.';

  // Index docs by their exact collection id only (no fallback aliases)
  type DocEntry = CollectionEntry<'docs'>;
  const docsById: Record<string, DocEntry> = {};
  for (const p of allPages as DocEntry[]) docsById[p.id] = p;

  // Convert a nav path to a collection id (no fallback to alternative forms)
  function pathToId(path?: string): string | undefined {
    if (!path) return undefined;
    let raw = path.split('#')[0]; // drop hash anchors
    raw = raw.replace(/\/+$/, '/'); // collapse trailing slashes to one (except root)
    // Strip leading slash
    raw = raw.replace(/^\//, '');
    if (raw === '' || raw === '/') return 'index';
    if (raw.endsWith('/')) {
      // directory explicit index
      return raw.slice(0, -1) + '/index';
    }
    return raw.replace(/\/$/, '');
  }

  function buildList(items: any[], acc: string[] = [], depth = 0): string[] {
    for (const item of items) {
      const id = pathToId(item.path);
      const page = id ? docsById[id] : undefined;
      if (page) {
        const basePath = (item.path as string).split('#')[0].replace(/\/$/, '');
        const url = `${site}${basePath}` || site;
        const mdUrl = `${url}.md`;
        const title = page.data.title.replace(/\n/g, ' ').trim();
        const desc = page.data.description.replace(/\n/g, ' ').trim();
        acc.push(`${'  '.repeat(depth)}- [${title}](${mdUrl}): ${desc}`);
      }
      if (item.children) buildList(item.children, acc, page ? depth + 1 : depth);
    }
    return acc;
  }

  interface Section {
    title: string;
    lines: string[];
  }
  const sections: Section[] = [];
  for (const item of navItems) {
    if (item.title === 'Home') continue;
    const lines = buildList([item], []);
    if (lines.length) sections.push({ title: item.title, lines });
  }

  const lines: string[] = [];
  lines.push(`# ${projectName}`);
  lines.push('');
  lines.push(`> ${summary}`);
  lines.push('');
  for (const section of sections) {
    lines.push(`## ${section.title}`);
    lines.push('');
    lines.push(...section.lines);
    lines.push('');
  }

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
