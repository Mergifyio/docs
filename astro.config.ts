import { RemarkPlugin } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vue from '@astrojs/vue';
import { defineConfig } from 'astro/config';
import AutoImport from 'astro-auto-import';
import { astroExpressiveCode } from 'astro-expressive-code';
import icon from 'astro-icon';
import dotenv, { DotenvPopulateInput } from 'dotenv';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import remarkSmartypants from 'remark-smartypants';
import { AlgoliaUpdateIndex } from './integrations/algolia-update-index';
import { asideAutoImport, astroAsides } from './integrations/astro-asides';
import { astroYoutubeEmbeds, youtubeAutoImport } from './integrations/astro-youtube-embed';
import { ScalarApiReference } from './integrations/scalar-api-reference';
import { autolinkConfig } from './plugins/rehype-autolink-config';
import { rehypeOptimizeStatic } from './plugins/rehype-optimize-static';
import { rehypeTasklistEnhancer } from './plugins/rehype-tasklist-enhancer';
import { remarkGraphvizPlugin } from './plugins/remark-graphviz';

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
      shikiConfig: { themes: { light: 'slack-ochin', dark: 'slack-dark' } },
    }),
    react({
      include: ['Tables'],
    }),
    vue(),
    sitemap({
      // To be iso with gatsby's sitemap, not sure it's useful
      changefreq: 'daily',
      priority: 0.7,
      filter: (page) => !page.startsWith('/enterprise'),
    }),
    ScalarApiReference(),
    AlgoliaUpdateIndex(),
    icon({
      include: {
        bi: ['*'],
        'fa-solid': ['*'],
        'fa-brands': ['*'],
        'fa6-solid': ['*'],
        'fa6-regular': ['*'],
        'fa-regular': ['*'],
        feather: ['*'],
        'grommet-icons': ['*'],
        heroicons: ['*'],
        ion: ['*'],
        mdi: ['*'],
        octicon: ['*'],
        'simple-icons': ['*'],
        tabler: ['*'],
      },
    }),
  ],
  scopedStyleStrategy: 'where',
  compressHTML: false,
  vite: {},
  markdown: {
    // Override with our own config
    smartypants: false,
    remarkPlugins: [
      remarkGraphvizPlugin(),
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
