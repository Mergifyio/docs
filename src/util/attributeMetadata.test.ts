import { describe, expect, test } from 'vitest';
import { getAttributeSource } from './attributeMetadata';

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
