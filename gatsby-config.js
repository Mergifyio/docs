const {algoliaSettings} = require('apollo-algolia-transform');
const {
  remarkTypescript,
  highlightPreservation,
  isWrapped
} = require('remark-typescript');
const {query, transformer} = require('./algolia');
const yaml = require('js-yaml');
const fs = require('fs');

const gatsbyRemarkPlugins = [
  '@fec/remark-a11y-emoji/gatsby',
  'gatsby-remark-mermaid',
  {
    resolve: 'gatsby-remark-copy-linked-files',
    options: {
      ignoreFileExtensions: []
    }
  },
  {
    resolve: 'gatsby-remark-autolink-headers',
    options: {
      icon: false
    }
  }
];

const plugins = [
  'gatsby-plugin-svgr',
  '@chakra-ui/gatsby-plugin',
  {
    resolve: 'gatsby-plugin-sitemap',
    options: {
      query: `
        {
          site {
            siteMetadata {
              siteUrl
            }
          }
          allSitePage {
            nodes {
              path
              pageContext
            }
          }
        }
      `,
      resolvePages: ({allSitePage}) =>
        // filter out internal pages
        allSitePage.nodes.filter(page => !page.pageContext.internal)
    }
  },
  'gatsby-plugin-combine-redirects', // local plugin
  {
    resolve: 'gatsby-plugin-manifest',
    options: {
      icon: 'src/assets/favicon.svg'
    }
  },
  'gatsby-plugin-offline',
  {
    resolve: 'gatsby-plugin-apollo',
    options: {
      uri: process.env.API_URL + '/api/graphql',
      credentials: 'include'
    }
  },
  {
    resolve: 'gatsby-plugin-next-seo',
    options: {
      titleTemplate: '%s - Mergify Docs',
      openGraph: {
        type: 'website',
        site_name: 'Mergify Docs'
      },
      twitter: {
        site: '@apollographql',
        cardType: 'summary_large_image'
      }
    }
  },
  {
    resolve: 'gatsby-plugin-webfonts',
    options: {
      fonts: {
        google: [
          {
            family: 'Source Sans Pro',
            variants: ['400', '600', '700']
          },
          {
            family: 'Source Code Pro',
            variants: ['400', '600']
          }
        ]
      }
    }
  },
  {
    resolve: 'gatsby-plugin-mdx',
    options: {
      gatsbyRemarkPlugins,
      remarkPlugins: [
        [
          remarkTypescript,
          {
            filter: isWrapped({wrapperComponent: 'MultiCodeBlock'}),
            customTransformations: [highlightPreservation()],
            prettierOptions: {
              trailingComma: 'all',
              singleQuote: true
            }
          }
        ]
      ],
      rehypePlugins: [[require('rehype-autolink-headings'), {behavior: 'wrap'}]]
    }
  },
  {
    resolve: 'gatsby-transformer-remark',
    options: {
      plugins: gatsbyRemarkPlugins
    }
  },
  {
    resolve: 'gatsby-plugin-env-variables',
    options: {
      allowList: ['ALGOLIA_APP_ID', 'ALGOLIA_SEARCH_KEY']
    }
  },
  {
    resolve: 'gatsby-plugin-algolia',
    options: {
      appId: process.env.ALGOLIA_APP_ID,
      apiKey: process.env.ALGOLIA_WRITE_KEY,
      skipIndexing: process.env.CONTEXT !== 'production',
      indexName: 'docs',
      queries: [
        {
          query,
          transformer,
          settings: {
            ...algoliaSettings,
            attributesForFaceting: ['categories', 'docset', 'type'],
            // put docs for current version at top, then by page views and index
            customRanking: [
              'desc(isCurrentVersion)',
              ...algoliaSettings.customRanking
            ]
          }
        }
      ]
    }
  },
  {
    resolve: '@colliercz/gatsby-transformer-gitinfo',
    // Will match all .md* files, except README.md
    options: {
      include: /\.mdx?$/i,
      ignore: /README/i
    }
  }
];

plugins.push(
  'gatsby-plugin-local-docs', // local plugin
  {
    resolve: 'gatsby-source-filesystem',
    options: {
      name: '/',
      path: 'src/content'
    }
  }
);

module.exports = {
  pathPrefix: '/docs',
  siteMetadata: {
    siteUrl: 'https://www.apollographql.com'
  },
  plugins
};
