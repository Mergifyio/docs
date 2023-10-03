import dotenv from 'dotenv'

dotenv.config({
  path: `.env.${process.env.NODE_ENV}`,
});

const gatsbyRemarkPlugins = [
  '@fec/remark-a11y-emoji/gatsby',
  {
    resolve: 'gatsby-remark-copy-linked-files',
    options: {
      destinationDir: f => `${f.name}`
    }
  },
  {
    resolve: 'gatsby-remark-autolink-headers',
    options: {
      icon: false
    }
  },
  {
    resolve: `gatsby-remark-images`,
    options: {
      maxWidth: 1200,
    },
  },
  'gatsby-remark-graphviz',
];

const plugins = [
  'gatsby-plugin-svgr',
  '@chakra-ui/gatsby-plugin',
  'gatsby-plugin-sitemap',
  {
    resolve: 'gatsby-plugin-manifest',
    options: {
      icon: 'src/assets/favicon.svg'
    }
  },
  'gatsby-plugin-offline',
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
          },
          {
            family: 'Poppins',
            variants: ['400', '600']
          }
        ]
      }
    }
  },
  {
    resolve: 'gatsby-plugin-mdx',
    options: {
      extensions: ['.mdx', '.md'],
      gatsbyRemarkPlugins,
    },
  },
  {
    resolve: 'gatsby-transformer-remark',
    options: {
      plugins: gatsbyRemarkPlugins
    }
  },
  'gatsby-plugin-local-docs', // local plugin
  {
    resolve: 'gatsby-source-filesystem',
    options: {
      name: '/',
      path: 'src/content'
    }
  },
  {
    resolve: `gatsby-plugin-netlify`,
    options: {
      headers: {
        "/*": [
          "Cache-control: public, max-age=600, no-transform",
          "Content-Security-Policy: default-src 'self' https:; " +
            "frame-ancestors 'none'; " +
            "script-src 'self' https: 'unsafe-inline'; " +
            "style-src 'self' 'unsafe-inline' https:; " +
            "img-src 'self' data: https:; " +
            "manifest-src 'self' data:",
        ]
      },
      allPageHeaders: [],
      mergeSecurityHeaders: true,
      mergeCachingHeaders: true,
      transformHeaders: (headers, path) => headers,
      generateMatchPathRewrites: true,
    },
  }
];

const algoliaPagesQuery = `
{
  pages: allFile(filter: {extension: {in: ["md", "mdx"]}}) {
    nodes {
      id
      internal {
        contentDigest
      }
      childMdx {
        tableOfContents
        fields {
          slug
        }
        excerpt(pruneLength: 1000)
        frontmatter {
          title
          description
          toc
          tags
        }
      }
    }
  }
}
`;

const queries = [
  {
    query: algoliaPagesQuery,
    transformer: ({ data }) => data.pages.nodes.map(node => {
      const { childMdx, ...rest} = node;
      delete rest.childMdx;
      return {
        ...childMdx,
        ...rest
      }
    })
  },
];

const algoliaPlugin = {
  resolve: `gatsby-plugin-algolia`,
  options: {
    appId: process.env.GATSBY_ALGOLIA_APP_ID,
    apiKey: process.env.ALGOLIA_WRITE_KEY,
    indexName: 'docs-pages',
    queries,
    chunkSize: 20000,
    dryRun: !process.env.ALGOLIA_WRITE_KEY,
    mergeSettings: true, // Merge settings with the ones defined on Algolia dashboard
    continueOnFailure: false,
  },
}

plugins.push(algoliaPlugin)

const config = {
  pathPrefix: '/' + process.env.PR_NUMBER + '/docs',
  trailingSlash: 'ignore',
  siteMetadata: {
    siteUrl: 'https://docs.mergify.com'
  },
  plugins
};

export default config;
