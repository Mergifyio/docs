import { defineCollection, z } from 'astro:content';

import { glob } from 'astro/loaders';

const docs = defineCollection({
	/* ... */
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

export const collections = { docs };
