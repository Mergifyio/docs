import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';
import { RemarkPlugin } from '@astrojs/markdown-remark';
import AutoImport from 'astro-auto-import';
import { astroExpressiveCode } from 'astro-expressive-code';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import remarkSmartypants from 'remark-smartypants';
import { asideAutoImport, astroAsides } from './integrations/astro-asides';
import { youtubeAutoImport, astroYoutubeEmbeds } from './integrations/astro-youtube-embed';
import { ScalarApiReference } from './integrations/scalar-api-reference';
import { autolinkConfig } from './plugins/rehype-autolink-config';
import { rehypeOptimizeStatic } from './plugins/rehype-optimize-static';
import { rehypeTasklistEnhancer } from './plugins/rehype-tasklist-enhancer';
import react from '@astrojs/react';
import { remarkGraphvizPlugin } from './plugins/remark-graphviz';
import dotenv, { DotenvPopulateInput } from 'dotenv';
import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';
import { remarkAlgolia } from './plugins/remark-algolia';

dotenv.config({
	path: `.env.${process.env.NODE_ENV}`,
});
dotenv.populate(process.env as DotenvPopulateInput, {
	PUBLIC_ALGOLIA_APP_ID: '81GKA2I1R0',
	PUBLIC_ALGOLIA_INDEX_NAME: 'docs-pages-dev',
	PUBLIC_ALGOLIA_SEARCH_KEY: '6fce1b6d8ccf82a6601a169c0167c0e3',
});

// https://astro.build/config
export default defineConfig({
	site: process.env.SITE_URL ? process.env.SITE_URL : 'https://docs.mergify.com',
	integrations: [
		AutoImport({
			imports: [asideAutoImport, youtubeAutoImport],
		}),
		astroAsides(),
		astroYoutubeEmbeds(),
        astroExpressiveCode({
            themes: ['slack-ochin', 'slack-dark'],
        }),
		mdx({
            syntaxHighlight: 'shiki',
            shikiConfig: { themes: {light:'slack-ochin', dark: 'slack-dark'}}
        }),
		react({
			include: ['react-icons', 'Tables'],
		}),
		vue(),
		sitemap({
			// To be iso with gatsby's sitemap, not sure it's usefull
			changefreq: 'daily',
			priority: 0.7,
		}),
        ScalarApiReference(),
	],
	scopedStyleStrategy: 'where',
	compressHTML: false,
	vite: {
		ssr: {
			noExternal: ['react-icons'],
		},
	},
	markdown: {
		// Override with our own config
		smartypants: false,
		remarkPlugins: [
			remarkGraphvizPlugin(),
			remarkAlgolia(),
			[
				remarkSmartypants as RemarkPlugin,
				{
					dashes: false,
				},
			],
		],

		rehypePlugins: [
			rehypeSlug,
			// This adds links to headings
			[rehypeAutolinkHeadings, autolinkConfig],
			// Tweak GFM task list syntax
			rehypeTasklistEnhancer(),
			// Collapse static parts of the hast to html

			/** Issue with graphviz where inline styles get transformed: `font-size` => `fontsize` whch breaks rendered graphs SVG */
			rehypeOptimizeStatic,
		],
	},
});
