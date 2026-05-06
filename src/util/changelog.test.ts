import type { CollectionEntry } from 'astro:content';
import { describe, expect, test } from 'vitest';
import { getPrevNextEntries, getProductAccent, getRelatedEntries } from './changelog';

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

function fakeEntry(id: string, dateISO: string): CollectionEntry<'changelog'> {
  return {
    id,
    collection: 'changelog',
    data: {
      title: id,
      date: new Date(dateISO),
      description: '',
      tags: [],
    },
    // Other CollectionEntry fields are not used by the helper
  } as unknown as CollectionEntry<'changelog'>;
}

describe('getPrevNextEntries', () => {
  const entries = [
    fakeEntry('a', '2026-05-06'),
    fakeEntry('b', '2026-05-05'),
    fakeEntry('c', '2026-05-04'),
    fakeEntry('d', '2026-05-03'),
  ];

  test('returns previous (older) and next (newer) for a middle entry', () => {
    const result = getPrevNextEntries(entries, 'b');
    expect(result.previous?.id).toBe('c');
    expect(result.next?.id).toBe('a');
  });

  test('returns null for previous when entry is the oldest', () => {
    const result = getPrevNextEntries(entries, 'd');
    expect(result.previous).toBeNull();
    expect(result.next?.id).toBe('c');
  });

  test('returns null for next when entry is the newest', () => {
    const result = getPrevNextEntries(entries, 'a');
    expect(result.previous?.id).toBe('b');
    expect(result.next).toBeNull();
  });

  test('returns both null when entry id is not found', () => {
    const result = getPrevNextEntries(entries, 'missing');
    expect(result.previous).toBeNull();
    expect(result.next).toBeNull();
  });

  test('works on an unsorted input array (sorts internally)', () => {
    const shuffled = [entries[2], entries[0], entries[3], entries[1]];
    const result = getPrevNextEntries(shuffled, 'b');
    expect(result.previous?.id).toBe('c');
    expect(result.next?.id).toBe('a');
  });
});

describe('getRelatedEntries', () => {
  function tagged(id: string, dateISO: string, tags: string[]): CollectionEntry<'changelog'> {
    return {
      id,
      collection: 'changelog',
      data: {
        title: id,
        date: new Date(dateISO),
        description: '',
        tags,
      },
    } as unknown as CollectionEntry<'changelog'>;
  }

  const entries = [
    tagged('a', '2026-05-06', ['Merge Queue']),
    tagged('b', '2026-05-05', ['Merge Queue', 'Workflow Automation']),
    tagged('c', '2026-05-04', ['CI Insights']),
    tagged('d', '2026-05-03', ['Merge Queue']),
    tagged('e', '2026-05-02', ['Merge Queue']),
    tagged('f', '2026-05-01', ['Merge Queue']),
  ];

  test('returns most-recent entries sharing the primary tag, excluding current', () => {
    const result = getRelatedEntries(entries, 'a', 'Merge Queue', 4);
    expect(result.map((e) => e.id)).toEqual(['b', 'd', 'e', 'f']);
  });

  test('respects the limit', () => {
    const result = getRelatedEntries(entries, 'a', 'Merge Queue', 2);
    expect(result.map((e) => e.id)).toEqual(['b', 'd']);
  });

  test('returns empty array when no other entry shares the tag', () => {
    const result = getRelatedEntries(entries, 'c', 'CI Insights', 4);
    expect(result).toEqual([]);
  });

  test('returns empty array when primary tag is undefined', () => {
    const result = getRelatedEntries(entries, 'a', undefined, 4);
    expect(result).toEqual([]);
  });

  test('matches when the tag is in any position of the entry tags array', () => {
    const result = getRelatedEntries(entries, 'a', 'Workflow Automation', 4);
    expect(result.map((e) => e.id)).toEqual(['b']);
  });
});
