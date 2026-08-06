import rehypeFormat from 'rehype-format';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

/**
 * Render a short markdown string (a schema description, a template variable
 * blurb) to HTML for injection via `dangerouslySetInnerHTML`.
 *
 * Sanitized on the way out. The input is always first-party — descriptions
 * synced from the engine's schemas — so this is defence in depth rather than a
 * response to untrusted input, but the output goes straight into the DOM and
 * several tables share this helper, so the guarantee belongs here and not in
 * each caller. Without it, `[x](javascript:...)` in a description would render
 * as a live `javascript:` link: `remark-rehype` does not filter URL protocols,
 * and being first-party is a property of today's callers, not of this function.
 *
 * `rehype-raw` is kept ahead of the sanitizer so that if a caller ever enables
 * `allowDangerousHtml`, the embedded HTML is parsed and then sanitized rather
 * than passed through as an opaque raw node.
 */
export function renderMarkdown(markdown: string) {
  const file = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeRaw)
    .use(rehypeSanitize)
    .use(rehypeFormat)
    .use(rehypeStringify)
    .processSync(markdown);

  return file.toString();
}
