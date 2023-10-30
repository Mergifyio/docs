import dotenv from 'dotenv'

dotenv.config({
  path: `.env.${process.env.NODE_ENV}`,
});

dotenv.populate(
  process.env, 
  {
    GATSBY_ALGOLIA_APP_ID: "81GKA2I1R0",
    GATSBY_ALGOLIA_SEARCH_KEY: "6fce1b6d8ccf82a6601a169c0167c0e3"
  },
  { override: true }
)

const gatsbyRemarkPlugins = [
  '@fec/remark-a11y-emoji/gatsby',
  'gatsby-remark-embed-video',
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
  'gatsby-plugin-react-helmet',
  'gatsby-plugin-svgr',
  '@chakra-ui/gatsby-plugin',
  'gatsby-plugin-sitemap',
  {
    resolve: 'gatsby-plugin-manifest',
    options: {
      icon: 'src/assets/favicon.svg'
    }
  },
  {
      resolve: `gatsby-plugin-plausible`,
      options: {
        domain: `docs.mergify.com`,
      },
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
            variants: ['300', '400', '600']
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
          "Content-Security-Policy: " +
            "default-src 'self'; " +
            "connect-src https://*.algolia.net https://*.algolianet.com https://*.algolia.io; " +
            "frame-ancestors 'none'; " +
            "script-src 'self' 'unsafe-inline' https://plausible.io; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data:; " +
            "manifest-src 'self' data:",
        ]
      },
      allPageHeaders: [],
      mergeSecurityHeaders: true,
      mergeCachingHeaders: true,
      transformHeaders: (headers, path) => headers,
      generateMatchPathRewrites: true,
    },
  },
];

/** Custom plugin to push records on algolia */
Boolean(process.env.ALGOLIA_WRITE_KEY) && plugins.push('algolia-plugin')

const config = {
  pathPrefix: '/' + process.env.PR_NUMBER + '/docs',
  trailingSlash: 'always',
  siteMetadata: {
    title: 'Mergify Documentation',
    description: 'Learn how to use Mergify, the powerful pull request automation tool that helps teams merge code faster and more safely. Automate your entire pull request workflow, from code review to deployment, and save time and frustration.',
    siteUrl: 'https://docs.mergify.com',
    image: '/favicon.svg'
  },
  plugins
};

export default config;
