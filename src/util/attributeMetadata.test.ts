import { describe, expect, test } from 'vitest';
import { getAttributeDocumentationUrl, getAttributeSource } from './attributeMetadata';

describe('getAttributeSource', () => {
  test('returns the source when present', () => {
    expect(getAttributeSource({ 'x-mergify-attribute-metadata': { source: 'github' } })).toBe(
      'github'
    );
  });

  test('returns undefined when the attribute has no metadata', () => {
    expect(getAttributeSource({ type: 'boolean' })).toBeUndefined();
  });

  test('returns undefined for a missing or malformed source', () => {
    expect(getAttributeSource({ 'x-mergify-attribute-metadata': {} })).toBeUndefined();
    expect(getAttributeSource({ 'x-mergify-attribute-metadata': { source: 42 } })).toBeUndefined();
  });

  test('returns undefined for non-object input', () => {
    expect(getAttributeSource(null)).toBeUndefined();
    expect(getAttributeSource('github')).toBeUndefined();
  });
});

describe('getAttributeDocumentationUrl', () => {
  test('returns the documentation URL when present', () => {
    expect(
      getAttributeDocumentationUrl({
        'x-mergify-attribute-metadata': {
          source: 'github',
          documentation_url: 'https://docs.github.com/some-page',
        },
      })
    ).toBe('https://docs.github.com/some-page');
  });

  test('returns undefined when the attribute has no metadata', () => {
    expect(getAttributeDocumentationUrl({ type: 'boolean' })).toBeUndefined();
  });

  test('returns undefined for a missing or malformed URL', () => {
    expect(
      getAttributeDocumentationUrl({ 'x-mergify-attribute-metadata': { source: 'github' } })
    ).toBeUndefined();
    expect(
      getAttributeDocumentationUrl({ 'x-mergify-attribute-metadata': { documentation_url: 42 } })
    ).toBeUndefined();
  });

  test('returns undefined for non-object input', () => {
    expect(getAttributeDocumentationUrl(null)).toBeUndefined();
    expect(getAttributeDocumentationUrl('github')).toBeUndefined();
  });
});
