import { describe, expect, it } from 'vitest';
import { onRequest } from './_middleware';

/**
 * Stands in for Cloudflare's asset server. `assets` maps a pathname to the
 * response it would serve; anything absent 404s, as it would in production.
 *
 * `next()` with no argument re-runs the original request, which is how the
 * middleware asks for the HTML after the Markdown twin came back missing.
 */
async function run(
  path: string,
  {
    assets,
    accept,
    method = 'GET',
  }: { assets: Record<string, Response>; accept?: string; method?: string }
): Promise<{ response: Response; seen: string[] }> {
  const request = new Request(`https://docs.mergify.com${path}`, {
    method,
    headers: accept ? { Accept: accept } : {},
  });
  const seen: string[] = [];
  const next = async (input: Request) => {
    // The middleware must always name the request it wants. A bare `next()` is
    // documented as re-forwarding the original, but the Pages runtime forwards
    // the last request it was given instead, so relying on it served the
    // Markdown 404 for pages that only have an HTML twin.
    if (!input) throw new Error('next() was called without an explicit Request');
    const pathname = new URL(input.url).pathname;
    seen.push(pathname);
    const asset = assets[pathname];
    // Pages serves the built `404.html` for anything it does not have.
    return (
      asset?.clone() ??
      new Response('<html>not found</html>', {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    );
  };
  return { response: await onRequest({ request, next }), seen };
}

const html = (body = '<html></html>', status = 200) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
const markdown = (body = '# Merge Queue') =>
  new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });

describe('markdown content negotiation', () => {
  it('serves the Markdown twin when Markdown is asked for', async () => {
    const { response, seen } = await run('/merge-queue', {
      accept: 'text/markdown',
      assets: { '/merge-queue.md': markdown(), '/merge-queue': html() },
    });

    expect(await response.text()).toBe('# Merge Queue');
    expect(response.headers.get('vary')).toBe('Accept');
    expect(seen).toEqual(['/merge-queue.md']);
  });

  it('passes a 304 straight through instead of falling back to HTML', async () => {
    // Regression: `.ok` is false for 304, so a client revalidating Markdown it
    // already holds was answered with the HTML page.
    const { response, seen } = await run('/merge-queue', {
      accept: 'text/markdown',
      assets: { '/merge-queue.md': new Response(null, { status: 304 }), '/merge-queue': html() },
    });

    expect(response.status).toBe(304);
    expect(response.headers.get('vary')).toBe('Accept');
    expect(seen).toEqual(['/merge-queue.md']);
  });

  it('falls back to HTML for a page with no Markdown twin', async () => {
    // `/api` and `/cli` are built from `src/pages/`, so no `.md` is generated.
    const { response, seen } = await run('/api', {
      accept: 'text/markdown',
      assets: { '/api': html('<html>api</html>') },
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('<html>api</html>');
    // The second call must ask for the original path, not repeat the `.md` one.
    expect(seen).toEqual(['/api.md', '/api']);
  });

  it('answers a missing page in the format that was asked for', async () => {
    const { response } = await run('/nope', { accept: 'text/markdown', assets: {} });

    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toContain('text/markdown');
    expect(await response.text()).toContain('llms.txt');

    const { response: asHtml } = await run('/nope', { assets: {} });
    expect(asHtml.status).toBe(404);
    expect(asHtml.headers.get('content-type')).toContain('text/html');
  });
});

describe('everything else', () => {
  it('serves HTML to a browser, and marks the response as negotiated', async () => {
    const { response, seen } = await run('/merge-queue', {
      accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
      assets: { '/merge-queue': html() },
    });

    expect(response.headers.get('content-type')).toContain('text/html');
    expect(response.headers.get('vary')).toBe('Accept');
    expect(seen).toEqual(['/merge-queue']);
  });

  it('leaves assets alone', async () => {
    const { response } = await run('/_astro/app.css', {
      accept: 'text/markdown',
      assets: {
        '/_astro/app.css': new Response('body{}', { headers: { 'Content-Type': 'text/css' } }),
      },
    });

    expect(response.headers.get('vary')).toBeNull();
  });

  it('leaves non-GET requests alone', async () => {
    const { response, seen } = await run('/merge-queue', {
      accept: 'text/markdown',
      method: 'POST',
      assets: { '/merge-queue': html() },
    });

    expect(response.headers.get('vary')).toBeNull();
    expect(seen).toEqual(['/merge-queue']);
  });

  it('preserves a Vary the asset server already set', async () => {
    const { response } = await run('/merge-queue', {
      assets: {
        '/merge-queue': new Response('<html></html>', {
          headers: { 'Content-Type': 'text/html', Vary: 'Accept-Encoding' },
        }),
      },
    });

    expect(response.headers.get('vary')).toBe('Accept-Encoding, Accept');
  });
});
