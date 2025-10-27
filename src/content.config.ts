import { defineCollection, z } from 'astro:content';

import { glob } from 'astro/loaders';

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
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { docs, changelog };
