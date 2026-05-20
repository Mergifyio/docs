import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { RemarkPlugin } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vue from '@astrojs/vue';
import { defineConfig } from 'astro/config';
import AutoImport from 'astro-auto-import';
import { astroExpressiveCode } from 'astro-expressive-code';
import icon from 'astro-icon';
import dotenv from 'dotenv';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import remarkSmartypants from 'remark-smartypants';
import { asideAutoImport, astroAsides } from './integrations/astro-asides';
import { astroYoutubeEmbeds, youtubeAutoImport } from './integrations/astro-youtube-embed';
import { PagefindIndex } from './integrations/pagefind-index';
import { autolinkConfig } from './plugins/rehype-autolink-config';
import { rehypeOptimizeStatic } from './plugins/rehype-optimize-static';
import { rehypeTasklistEnhancer } from './plugins/rehype-tasklist-enhancer';
import { rehypeWrapTables } from './plugins/rehype-wrap-tables';
import { remarkBuildkiteVersionPlugin } from './plugins/remark-buildkite-version';
import { remarkEnterpriseVersionPlugin } from './plugins/remark-enterprise-version';
import { remarkGraphvizPlugin } from './plugins/remark-graphviz';

dotenv.config({
  path: `.env.${process.env.NODE_ENV}`,
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
    astroExpressiveCode(),
    mdx(),
    react(),
    vue(),
    sitemap({
      // To be iso with gatsby's sitemap, not sure it's useful
      changefreq: 'daily',
      priority: 0.7,
      filter: (page) =>
        !page.includes('/enterprise') &&
        !page.includes('/support/premium') &&
        !page.includes('/merge-queue/migrate-partitions-to-scopes'),
    }),
    PagefindIndex(),
    icon({
      include: {
        lucide: ['*'],
        octicon: ['*'],
        'simple-icons': ['*'],
      },
    }),
  ],
  compressHTML: false,
  vite: {
    plugins: [
      {
        // Pagefind's JS bundle is not a standard ES module Vite can transform.
        // Serve it directly from public/ so dynamic `import('/pagefind/pagefind.js')` works in dev.
        name: 'pagefind-static',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (!req.url?.startsWith('/pagefind/')) return next();
            const cleanPath = req.url.split('?')[0];
            const filePath = join(process.cwd(), 'public', cleanPath);
            if (!existsSync(filePath)) return next();
            const mimeTypes: Record<string, string> = {
              '.js': 'application/javascript',
              '.json': 'application/json',
              '.wasm': 'application/wasm',
            };
            res.setHeader(
              'Content-Type',
              mimeTypes[extname(filePath)] ?? 'application/octet-stream'
            );
            res.end(readFileSync(filePath));
          });
        },
      },
    ],
  },
  markdown: {
    // Override with our own config
    smartypants: false,
    remarkPlugins: [
      remarkBuildkiteVersionPlugin(),
      remarkEnterpriseVersionPlugin(),
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
      // Wrap markdown tables in a scrollable container
      rehypeWrapTables(),
      // Collapse static parts of the hast to html

      /** Issue with graphviz where inline styles get transformed: `font-size` => `fontsize` whch breaks rendered graphs SVG */
      rehypeOptimizeStatic,
    ],
  },
});
