import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { APIRoute } from 'astro';
import { allPages } from '~/content';

/**
 * Provides raw markdown (MDX source) versions of each documentation page at the
 * same route with `.md` appended, e.g. `/getting-started.md`.
 * This enables llms.txt consumers to fetch LLM-friendly source content.
 */
export async function getStaticPaths() {
  return allPages.map((page) => ({
    // For catch-all `[...slug]` we must provide the full id as a string (not array),
    // mirroring the pattern used in `[...slug].astro` so that `index` maps to /index.md
    params: { slug: page.id },
    props: { id: page.id },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { id } = props as { id: string };
  const fsPath = path.join(process.cwd(), 'src', 'content', 'docs', id + '.mdx');
  try {
    let source = await readFile(fsPath, 'utf-8');
    if (!source.endsWith('\n')) source += '\n';
    return new Response(source, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
  } catch {
    return new Response('Not found', { status: 404 });
  }
};
