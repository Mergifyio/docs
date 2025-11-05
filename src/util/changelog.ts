import type { CollectionEntry } from 'astro:content';

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
 * Format month and year (e.g., "January 2025")
 */
export function formatMonthYear(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });
}
