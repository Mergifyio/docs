import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './utils';

// `renderMarkdown` output is injected with `dangerouslySetInnerHTML` by every
// schema-driven table, so what it lets through is a security property.
//
// Two different layers provide that, and it is worth keeping them apart: raw
// HTML never survives because `remark-rehype` runs without
// `allowDangerousHtml`, which is true with or without the sanitizer. Only the
// URL-protocol filtering below actually exercises `rehype-sanitize` — those
// are the assertions that fail if it is removed.
describe('renderMarkdown', () => {
  it('renders the markdown the schema descriptions actually use', () => {
    const html = renderMarkdown('A [real link](https://example.com) and `code`.');
    expect(html).toContain('<a href="https://example.com">real link</a>');
    expect(html).toContain('<code>code</code>');
  });

  it('keeps relative links, anchors and mailto', () => {
    expect(renderMarkdown('[a](/merge-queue/batches)')).toContain('href="/merge-queue/batches"');
    expect(renderMarkdown('[a](#batch-status)')).toContain('href="#batch-status"');
    expect(renderMarkdown('[a](mailto:x@example.com)')).toContain('href="mailto:x@example.com"');
  });

  // These are the sanitizer's own guarantee: `remark-rehype` emits an <a> for
  // any link target, whatever its protocol, so without `rehype-sanitize` each
  // of these renders as a live link.
  describe('URL protocol filtering (rehype-sanitize)', () => {
    it('strips a javascript: link rather than emitting a live one', () => {
      const html = renderMarkdown('[click](javascript:alert(1))');
      expect(html).toContain('click');
      expect(html).not.toContain('javascript:');
    });

    it('strips a case-obfuscated javascript: link', () => {
      expect(renderMarkdown('[click](JaVaScRiPt:alert(1))')).not.toContain('alert(1)');
    });

    it('strips a data: URL on an image', () => {
      expect(renderMarkdown('![x](data:text/html;base64,PHNjcmlwdD4=)')).not.toContain(
        'data:text/html'
      );
    });
  });

  // Kept as a regression pin on the pipeline as a whole, not on the sanitizer:
  // these pass because raw HTML is discarded before it becomes a node. If a
  // caller ever enables `allowDangerousHtml`, `rehype-raw` parses it and the
  // sanitizer becomes what keeps these green.
  describe('raw HTML never reaches the output', () => {
    it('drops an event handler', () => {
      expect(renderMarkdown('<img src=x onerror="alert(1)">')).not.toContain('onerror');
    });

    it('drops a script tag', () => {
      expect(renderMarkdown('<script>alert(1)</script>')).not.toContain('<script');
    });
  });
});
