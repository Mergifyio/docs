import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const docs = defineCollection({
  /* Documentation pages */
  loader: glob({
    pattern: '**/[^_]*.mdx',
    base: './src/content/docs',
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    suppressTitle: z.boolean().optional(),
    hubAccent: z.boolean().optional(),
  }),
});

const changelog = defineCollection({
  loader: glob({
    pattern: '**/[^_]*.mdx',
    base: './src/content/changelog',
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string().optional(),
    // Accept null/undefined and coerce to [] so frontmatter like `tags: null` is tolerated
    tags: z.preprocess((val) => (val == null ? [] : val), z.array(z.string())).default([]),
    image: z
      .object({
        src: z.string(),
        alt: z.string(),
      })
      .optional(),
  }),
});

/*
  Upgrade notes for one on-premise release, written by hand.

  The release list itself comes from `src/data/enterprise-releases.json`, which is
  synced automatically, and the changes a release carries are derived from the
  changelog. This collection only holds what neither of those can know: what an
  operator has to do. Most releases need no file — see the README beside this
  collection's directory.
*/
const enterpriseReleaseNotes = defineCollection({
  loader: glob({
    pattern: '**/[^_]*.mdx',
    base: './src/content/enterpriseReleaseNotes',
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ''),
  }),
  schema: z.object({
    /* The release these notes describe, exactly as it appears in enterprise-releases.json. */
    version: z.string(),
    /* Set when upgrading needs a deliberate step: a renamed variable to carry
       over, a removed option to drop, an order to follow. Renders a marker beside
       the version so the release stands out to somebody scanning the list. */
    actionRequired: z.boolean().default(false),
  }),
});

export const collections = { docs, changelog, enterpriseReleaseNotes };
