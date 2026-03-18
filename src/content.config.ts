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
  }),
});

export const collections = { docs, changelog };
