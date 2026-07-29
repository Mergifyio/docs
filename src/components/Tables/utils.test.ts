import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './utils';

// `renderMarkdown` output is injected with `dangerouslySetInnerHTML` by every
// schema-driven table, so what it lets through is a security property, not a
// formatting detail. These lock it.
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

  it('strips javascript: and data: URLs rather than emitting a live link', () => {
    expect(renderMarkdown('[click](javascript:alert(1))')).not.toContain('javascript:');
    expect(renderMarkdown('[click](JaVaScRiPt:alert(1))')).not.toContain('alert(1)');
    expect(renderMarkdown('![x](data:text/html;base64,PHNjcmlwdD4=)')).not.toContain(
      'data:text/html'
    );
  });

  it('drops raw HTML, including event handlers and script tags', () => {
    expect(renderMarkdown('<img src=x onerror="alert(1)">')).not.toContain('onerror');
    expect(renderMarkdown('<script>alert(1)</script>')).not.toContain('<script');
  });
});
