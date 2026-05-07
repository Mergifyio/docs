import { describe, expect, test } from 'vitest';
import { getProductAccent, renderInlineMarkdown } from './changelog';

describe('getProductAccent', () => {
  test('maps Merge Queue to teal-700', () => {
    expect(getProductAccent('Merge Queue')).toEqual({
      bar: 'var(--color-teal-700)',
      text: 'var(--color-teal-700)',
    });
  });

  test('maps Workflow Automation to rose-700', () => {
    expect(getProductAccent('Workflow Automation')).toEqual({
      bar: 'var(--color-rose-700)',
      text: 'var(--color-rose-700)',
    });
  });

  test('maps CI Insights to purple-700', () => {
    expect(getProductAccent('CI Insights')).toEqual({
      bar: 'var(--color-purple-700)',
      text: 'var(--color-purple-700)',
    });
  });

  test('maps Test Insights to orange-700', () => {
    expect(getProductAccent('Test Insights')).toEqual({
      bar: 'var(--color-orange-700)',
      text: 'var(--color-orange-700)',
    });
  });

  test('maps Merge Protections to blue-700', () => {
    expect(getProductAccent('Merge Protections')).toEqual({
      bar: 'var(--color-blue-700)',
      text: 'var(--color-blue-700)',
    });
  });

  test('maps Stacks to coral-700', () => {
    expect(getProductAccent('Stacks')).toEqual({
      bar: 'var(--color-coral-700)',
      text: 'var(--color-coral-700)',
    });
  });

  test('falls back to neutral for Deprecations (no explicit mapping)', () => {
    expect(getProductAccent('Deprecations')).toEqual({
      bar: 'var(--theme-text-muted)',
      text: 'var(--theme-text-secondary)',
    });
  });

  test('maps Enterprise to dark neutral', () => {
    expect(getProductAccent('Enterprise')).toEqual({
      bar: 'var(--theme-text)',
      text: 'var(--theme-text)',
    });
  });

  test('falls back to neutral for unknown tag', () => {
    expect(getProductAccent('Some New Product')).toEqual({
      bar: 'var(--theme-text-muted)',
      text: 'var(--theme-text-secondary)',
    });
  });

  test('handles undefined as fallback', () => {
    expect(getProductAccent(undefined)).toEqual({
      bar: 'var(--theme-text-muted)',
      text: 'var(--theme-text-secondary)',
    });
  });
});

describe('renderInlineMarkdown', () => {
  test('passes plain text through unchanged', () => {
    expect(renderInlineMarkdown('Hello world')).toBe('Hello world');
  });

  test('converts backtick code spans to <code> tags', () => {
    expect(renderInlineMarkdown('Configure `auto_merge_conditions`')).toBe(
      'Configure <code>auto_merge_conditions</code>'
    );
  });

  test('handles multiple code spans on one line', () => {
    expect(renderInlineMarkdown('`foo` and `bar`')).toBe('<code>foo</code> and <code>bar</code>');
  });

  test('escapes HTML in surrounding text', () => {
    expect(renderInlineMarkdown('Use <script> tag')).toBe('Use &lt;script&gt; tag');
  });

  test('escapes HTML inside code spans too', () => {
    expect(renderInlineMarkdown('use `<div>` here')).toBe('use <code>&lt;div&gt;</code> here');
  });

  test('leaves an unpaired backtick literal', () => {
    expect(renderInlineMarkdown('only `one open')).toBe('only `one open');
  });

  test('escapes ampersands and quotes', () => {
    expect(renderInlineMarkdown('Tom & Jerry "win"')).toBe('Tom &amp; Jerry &quot;win&quot;');
  });
});
