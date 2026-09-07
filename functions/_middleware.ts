import { isNegotiablePage, prefersMarkdown } from '../src/util/acceptMarkdown';
import { getMarkdownPath } from '../src/util/getMarkdownPath';

/**
 * Cloudflare Pages middleware: serve the Markdown twin of a page to clients that
 * ask for it with `Accept: text/markdown` (https://acceptmarkdown.com).
 *
 * The site is a static build, so this is the only layer that sees request
 * headers. It stays deliberately thin — the decision itself lives in
 * `src/util/acceptMarkdown.ts`, where it is unit-tested.
 */

/**
 * The slice of Cloudflare's `EventContext` we use. Declared structurally rather
 * than pulling in `@cloudflare/workers-types`: this is the only Worker in the
 * repo, and `tsconfig.json` scopes typechecking to `src/`.
 */
interface MiddlewareContext {
  request: Request;
  /**
   * Always call this with an explicit request. A bare `next()` is documented as
   * forwarding the original one, but once the middleware has asked for the
   * Markdown twin the runtime forwards *that* request again instead — which
   * answered `/api`, a page with no twin, with the Markdown 404 rather than its
   * HTML.
   */
  next: (input: Request) => Promise<Response>;
}

/** Body served when an agent asks for Markdown and the path does not exist. */
const MARKDOWN_404 = `# 404 — Page not found

This path does not exist in the Mergify documentation.

- [Documentation index](https://docs.mergify.com/index.md)
- [llms.txt](https://docs.mergify.com/llms.txt) — every page, with descriptions
- [Sitemap](https://docs.mergify.com/sitemap-index.xml)
- [OpenAPI description](https://docs.mergify.com/openapi.json) — the Mergify REST API

Most documentation pages also serve their Markdown source: append \`.md\` to the
URL, or send \`Accept: text/markdown\`. The generated API and CLI references are
HTML only.
`;

/**
 * Republish a response with `Accept` merged into `Vary`.
 *
 * Without it a CDN that cached the HTML variant first would hand it to an agent
 * asking for Markdown (and vice versa). Only applied to the negotiated media
 * types: putting `Vary: Accept` on images and CSS would fragment their cache
 * keys for nothing.
 */
function withVaryAccept(response: Response): Response {
  const contentType = response.headers.get('content-type') ?? '';
  const negotiated =
    contentType.startsWith('text/html') ||
    contentType.startsWith('text/markdown') ||
    // A `304 Not Modified` carries no content type but still answers for one
    // of the two variants, and needs the header most of all: it is the reply
    // to a cache that is about to reuse a stored representation.
    response.status === 304;
  if (!negotiated) return response;

  const varied = new Response(response.body, response);
  const existing = varied.headers.get('vary');
  const fields = new Set(
    (existing ?? '')
      .split(',')
      .map((field) => field.trim())
      .filter(Boolean)
  );
  fields.add('Accept');
  varied.headers.set('Vary', Array.from(fields).join(', '));
  return varied;
}

export async function onRequest(context: MiddlewareContext): Promise<Response> {
  const { request, next } = context;

  if (request.method !== 'GET' && request.method !== 'HEAD') return next(request);

  const url = new URL(request.url);
  if (!isNegotiablePage(url.pathname)) return next(request);

  if (!prefersMarkdown(request.headers.get('accept'))) {
    return withVaryAccept(await next(request));
  }

  const markdownUrl = new URL(getMarkdownPath(url.pathname), url);
  markdownUrl.search = url.search;
  const markdown = await next(new Request(markdownUrl, request));

  // Fall back to HTML only when there is genuinely no Markdown twin. Keying
  // this off `ok` would also catch `304 Not Modified` — the normal answer to a
  // client revalidating Markdown it already holds — and serve it HTML instead,
  // and would turn a redirect or a 5xx from the `.md` route into HTML too.
  if (markdown.status !== 404) return withVaryAccept(markdown);

  // No Markdown twin: either a page we do not generate one for (`/api` and
  // `/cli` are built from `src/pages/`), or a path that does not exist at all.
  // Answer 404s in the format that was asked for; hand anything else back as
  // HTML.
  const html = await next(request);
  if (html.status !== 404) return withVaryAccept(html);

  return withVaryAccept(
    new Response(MARKDOWN_404, {
      status: 404,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    })
  );
}
