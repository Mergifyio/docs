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
import { ScalarApiReference } from './integrations/scalar-api-reference';
import { autolinkConfig } from './plugins/rehype-autolink-config';
import { rehypeOptimizeStatic } from './plugins/rehype-optimize-static';
import { rehypeTasklistEnhancer } from './plugins/rehype-tasklist-enhancer';
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
    astroExpressiveCode({
      themes: ['slack-ochin', 'slack-dark'],
      themeCssSelector: (theme) => {
        if (theme.name === 'slack-ochin') return ':root:not(.theme-dark)';
        if (theme.name === 'slack-dark') return ':root.theme-dark';
        return `[data-theme='${theme.name}']`;
      },
      styleOverrides: {
        borderColor: 'hsla(var(--color-blue), 0.15)',
        borderRadius: '0.5rem',
        borderWidth: '1px',
        codePaddingBlock: '1rem',
        codePaddingInline: '1.25rem',
        codeFontFamily: 'var(--font-mono)',
        codeFontSize: '0.85rem',
        codeLineHeight: '1.7',
        uiFontFamily: 'var(--font-body)',
        uiFontSize: '0.8rem',
        focusBorder: 'var(--color-mergify-blue)',
        frames: {
          frameBoxShadowCssValue: 'none',
          editorTabBarBorderBottomColor: 'var(--theme-divider)',
          editorActiveTabIndicatorBottomColor: 'var(--color-mergify-blue)',
          editorActiveTabIndicatorTopColor: 'transparent',
          terminalTitlebarBorderBottomColor: 'var(--theme-divider)',
          tooltipSuccessBackground: 'var(--color-mergify-blue)',
          tooltipSuccessForeground: '#fff',
          inlineButtonBorder: 'var(--theme-divider)',
          inlineButtonForeground: 'var(--theme-text-lighter)',
          inlineButtonBackgroundIdleOpacity: '0',
          inlineButtonBackgroundHoverOrFocusOpacity: '0.08',
        },
      },
    }),
    mdx(),
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
    PagefindIndex(),
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
