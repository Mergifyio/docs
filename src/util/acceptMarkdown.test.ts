import { describe, expect, it } from 'vitest';
import { isNegotiablePage, prefersMarkdown } from './acceptMarkdown';

describe('prefersMarkdown', () => {
  it('serves Markdown when it is asked for explicitly', () => {
    expect(prefersMarkdown('text/markdown')).toBe(true);
    expect(prefersMarkdown('text/markdown, text/plain;q=0.5')).toBe(true);
    expect(prefersMarkdown('TEXT/MARKDOWN')).toBe(true);
  });

  it('leaves browsers alone', () => {
    // Chrome and Firefox both rank HTML first and end on a `*/*` catch-all. If
    // wildcards counted, every human visitor would be served raw Markdown.
    expect(
      prefersMarkdown(
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
      )
    ).toBe(false);
    expect(prefersMarkdown('*/*')).toBe(false);
    expect(prefersMarkdown('text/*')).toBe(false);
  });

  it('respects q-values when both formats are named', () => {
    expect(prefersMarkdown('text/markdown;q=0.9, text/html;q=0.8')).toBe(true);
    expect(prefersMarkdown('text/markdown;q=0.5, text/html')).toBe(false);
    expect(prefersMarkdown('text/markdown;q=0, text/html;q=0')).toBe(false);
  });

  it('falls back to HTML when nothing was asked for', () => {
    expect(prefersMarkdown(null)).toBe(false);
    expect(prefersMarkdown('')).toBe(false);
  });
});

describe('isNegotiablePage', () => {
  it('matches documentation pages', () => {
    expect(isNegotiablePage('/')).toBe(true);
    expect(isNegotiablePage('/merge-queue')).toBe(true);
    expect(isNegotiablePage('/api/usage/')).toBe(true);
  });

  it('leaves assets untouched', () => {
    expect(isNegotiablePage('/merge-queue.md')).toBe(false);
    expect(isNegotiablePage('/openapi.json')).toBe(false);
    expect(isNegotiablePage('/llms.txt')).toBe(false);
    expect(isNegotiablePage('/_astro/MainLayout.lvKlb881.css')).toBe(false);
    expect(isNegotiablePage('/open-graph/index.png')).toBe(false);
  });
});
