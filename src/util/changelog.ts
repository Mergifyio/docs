import type { CollectionEntry } from 'astro:content';
import { escape } from './html-entities';

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

/**
 * Group timeline entries by year and day. The day key is the ISO
 * `YYYY-MM-DD` string, which sorts lexicographically the same as
 * chronologically and is trivial to re-format for display. Year and day
 * are both derived in UTC so an entry never lands under a year that
 * disagrees with its day key (e.g., a December 31 release published at
 * UTC midnight in a westerly zone).
 */
export function groupTimelineByYearDay(
  entries: TimelineEntry[]
): Record<string, Record<string, TimelineEntry[]>> {
  return entries.reduce(
    (acc, entry) => {
      const date = new Date(entry.date);
      const year = date.getUTCFullYear().toString();
      const day = formatDate(entry.date);

      if (!acc[year]) acc[year] = {};
      if (!acc[year][day]) acc[year][day] = [];
      acc[year][day].push(entry);
      return acc;
    },
    {} as Record<string, Record<string, TimelineEntry[]>>
  );
}

/**
 * Format a date as a short, human-readable day label (e.g., "May 6").
 * Formatted in UTC to match the UTC-based day key used for grouping —
 * otherwise zones west of UTC would render an ISO `YYYY-MM-DD` (UTC
 * midnight) as the previous day.
 */
export function formatDayLabel(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
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
 * spans become <code>. The shared `escape` helper handles HTML entity escaping
 * (kept consistent with the rest of the codebase), then code-span pairs are
 * substituted with real <code> tags. We avoid a full markdown parser because
 * titles only ever use code spans in practice.
 */
export function renderInlineMarkdown(text: string): string {
  return escape(text).replace(/`([^`]+)`/g, '<code>$1</code>');
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
