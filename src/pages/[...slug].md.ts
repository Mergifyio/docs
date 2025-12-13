import { getCollection } from 'astro:content';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { APIRoute } from 'astro';
import { allPages } from '~/content';

type MarkdownSourceProps = {
  id: string;
  collection: 'docs' | 'changelog';
};

/**
 * Provides raw markdown (MDX source) versions of each documentation page at the
 * same route with `.md` appended, e.g. `/getting-started.md`.
 * This enables llms.txt consumers to fetch LLM-friendly source content.
 */
export async function getStaticPaths() {
  const docPaths = allPages.map((page) => ({
    // For catch-all `[...slug]` we must provide the full id as a string (not array),
    // mirroring the pattern used in `[...slug].astro` so that `index` maps to /index.md
    params: { slug: page.id },
    props: { id: page.id, collection: 'docs' } satisfies MarkdownSourceProps,
  }));

  const changelogEntries = await getCollection('changelog');
  const changelogPaths = changelogEntries.map((entry) => ({
    params: { slug: `changelog/${entry.slug}` },
    props: { id: entry.slug, collection: 'changelog' } satisfies MarkdownSourceProps,
  }));

  return [...docPaths, ...changelogPaths];
}

export const GET: APIRoute = async ({ props }) => {
  const { id, collection } = props as MarkdownSourceProps;
  const fsPath = path.join(process.cwd(), 'src', 'content', collection, id + '.mdx');
  try {
    let source = await readFile(fsPath, 'utf-8');
    if (!source.endsWith('\n')) source += '\n';
    return new Response(source, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
  } catch {
    return new Response('Not found', { status: 404 });
  }
};
