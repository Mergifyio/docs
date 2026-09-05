/**
 * Content negotiation for the Markdown twin of every docs page.
 *
 * Every page already ships a `.md` source at `<path>.md` (see
 * `src/pages/[...slug].md.ts`), which is what the "View as Markdown" button and
 * `llms.txt` link to. The convention agents actually try first, though, is to
 * ask for the page's own URL with `Accept: text/markdown` — see
 * https://acceptmarkdown.com. This module decides when to honour that.
 */

interface AcceptEntry {
  type: string;
  q: number;
}

function parseAccept(header: string): AcceptEntry[] {
  return header
    .split(',')
    .map((part) => {
      const [rawType, ...params] = part.split(';');
      const type = rawType.trim().toLowerCase();
      if (!type) return undefined;
      // Only `q` matters to us; any other accept-param is ignored.
      let q = 1;
      for (const param of params) {
        const [key, value] = param.split('=');
        if (key?.trim().toLowerCase() !== 'q') continue;
        const parsed = Number.parseFloat(value ?? '');
        if (Number.isFinite(parsed)) q = parsed;
      }
      return { type, q };
    })
    .filter((entry): entry is AcceptEntry => entry !== undefined);
}

/**
 * Whether a request asking for `Accept: <header>` should be served Markdown.
 *
 * Deliberately requires `text/markdown` to be named explicitly: browsers send
 * `text/html,...,*\/*;q=0.8`, so honouring wildcards would hand Markdown to
 * every human visitor whose browser happens to list HTML at a lower q than the
 * catch-all. An agent that wants Markdown says so.
 */
export function prefersMarkdown(header: string | null | undefined): boolean {
  if (!header) return false;

  const entries = parseAccept(header);
  const markdown = entries.find((entry) => entry.type === 'text/markdown');
  if (!markdown || markdown.q <= 0) return false;

  // A client that lists both and ranks HTML higher gets HTML.
  const html = entries.find((entry) => entry.type === 'text/html');
  return html === undefined || markdown.q >= html.q;
}

/**
 * Whether a path is a docs page with a Markdown twin, as opposed to an asset.
 *
 * Pages are extensionless (`/merge-queue`, `/api/usage/`); anything carrying a
 * file extension is a static asset and is served untouched.
 */
export function isNegotiablePage(pathname: string): boolean {
  if (pathname === '/') return true;
  const lastSegment = pathname.replace(/\/$/, '').split('/').pop() ?? '';
  return !lastSegment.includes('.');
}
