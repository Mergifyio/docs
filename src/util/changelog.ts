import type { CollectionEntry } from 'astro:content';

type DateCarrier = {
  date: Date | string;
};

function groupByYearMonthGeneric<T extends DateCarrier>(
  entries: T[]
): Record<string, Record<string, T[]>> {
  return entries.reduce(
    (acc, entry) => {
      const date = new Date(entry.date);
      const year = date.getFullYear().toString();
      const month = date.toLocaleDateString('en-US', { month: 'long' });

      if (!acc[year]) {
        acc[year] = {};
      }
      if (!acc[year][month]) {
        acc[year][month] = [];
      }
      acc[year][month].push(entry);
      return acc;
    },
    {} as Record<string, Record<string, T[]>>
  );
}

export type TimelineEntry =
  | { kind: 'changelog'; date: Date | string; entry: CollectionEntry<'changelog'> }
  | { kind: 'release'; date: Date | string; version: string };

/**
 * Sort changelog entries by date in descending order (newest first)
 */
export function sortChangelog(
  entries: CollectionEntry<'changelog'>[]
): CollectionEntry<'changelog'>[] {
  // Avoid mutating the original array: sort a shallow copy instead
  return entries.slice().sort((a, b) => {
    const dateA = new Date(a.data.date);
    const dateB = new Date(b.data.date);
    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * Group changelog entries by year
 */
export function groupByYear(
  entries: CollectionEntry<'changelog'>[]
): Record<string, CollectionEntry<'changelog'>[]> {
  return entries.reduce(
    (acc, entry) => {
      const year = new Date(entry.data.date).getFullYear().toString();
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(entry);
      return acc;
    },
    {} as Record<string, CollectionEntry<'changelog'>[]>
  );
}

/**
 * Format a date as YYYY-MM-DD for technical use (datetime attribute)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Format a date in a human-readable format (e.g., "January 15, 2025")
 */
export function formatDateHuman(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Group changelog entries by year and month
 */
export function groupByYearMonth(
  entries: CollectionEntry<'changelog'>[]
): Record<string, Record<string, CollectionEntry<'changelog'>[]>> {
  return entries.reduce(
    (acc, entry) => {
      const date = new Date(entry.data.date);
      const year = date.getFullYear().toString();
      const month = date.toLocaleDateString('en-US', { month: 'long' });

      if (!acc[year]) {
        acc[year] = {};
      }
      if (!acc[year][month]) {
        acc[year][month] = [];
      }
      acc[year][month].push(entry);
      return acc;
    },
    {} as Record<string, Record<string, CollectionEntry<'changelog'>[]>>
  );
}

export function groupTimelineByYearMonth(
  entries: TimelineEntry[]
): Record<string, Record<string, TimelineEntry[]>> {
  return groupByYearMonthGeneric(entries);
}

/**
 * Format month and year (e.g., "January 2025")
 */
export function formatMonthYear(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });
}

/**
 * Render a tiny subset of inline markdown for changelog titles: backtick code
 * spans become <code>. HTML is escaped first, so the result is safe to render
 * with set:html. We avoid a full markdown parser because titles only ever use
 * code spans in practice.
 */
export function renderInlineMarkdown(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  return escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
}

export interface ProductAccent {
  bar: string;
  text: string;
}

const PRODUCT_ACCENTS: Record<string, ProductAccent> = {
  'Merge Queue': { bar: 'var(--color-teal-700)', text: 'var(--color-teal-700)' },
  'Workflow Automation': { bar: 'var(--color-rose-700)', text: 'var(--color-rose-700)' },
  'CI Insights': { bar: 'var(--color-purple-700)', text: 'var(--color-purple-700)' },
  'Test Insights': { bar: 'var(--color-orange-700)', text: 'var(--color-orange-700)' },
  'Merge Protections': { bar: 'var(--color-blue-700)', text: 'var(--color-blue-700)' },
  Stacks: { bar: 'var(--color-coral-700)', text: 'var(--color-coral-700)' },
  Enterprise: { bar: 'var(--theme-text)', text: 'var(--theme-text)' },
};

const NEUTRAL_ACCENT: ProductAccent = {
  bar: 'var(--theme-text-muted)',
  text: 'var(--theme-text-secondary)',
};

/**
 * Map a changelog tag to its left-bar accent color and detail-page eyebrow color.
 * Unknown tags (and Deprecations) fall back to a neutral gray.
 */
export function getProductAccent(tag: string | undefined): ProductAccent {
  if (!tag) return NEUTRAL_ACCENT;
  return PRODUCT_ACCENTS[tag] ?? NEUTRAL_ACCENT;
}

export interface PrevNext {
  previous: CollectionEntry<'changelog'> | null;
  next: CollectionEntry<'changelog'> | null;
}

/**
 * Given a sorted-or-unsorted list of changelog entries and a current entry id,
 * return the chronologically previous (older) and next (newer) entries.
 */
export function getPrevNextEntries(
  entries: CollectionEntry<'changelog'>[],
  currentId: string
): PrevNext {
  const sorted = sortChangelog(entries);
  const idx = sorted.findIndex((e) => e.id === currentId);
  if (idx === -1) return { previous: null, next: null };
  return {
    // sorted is newest-first, so previous (older) is at idx + 1
    previous: sorted[idx + 1] ?? null,
    next: sorted[idx - 1] ?? null,
  };
}

/**
 * Return up to `limit` most-recent entries that share the given tag,
 * excluding the entry with `currentId`. Returns [] when tag is undefined
 * or no other entry matches.
 */
export function getRelatedEntries(
  entries: CollectionEntry<'changelog'>[],
  currentId: string,
  tag: string | undefined,
  limit: number
): CollectionEntry<'changelog'>[] {
  if (!tag) return [];
  return sortChangelog(entries)
    .filter((e) => e.id !== currentId && (e.data.tags || []).includes(tag))
    .slice(0, limit);
}
