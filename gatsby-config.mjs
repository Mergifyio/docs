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
  'gatsby-plugin-combine-redirects', // local plugin
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

const config = {
  pathPrefix: '/' + process.env.PR_NUMBER + '/docs',
  trailingSlash: 'ignore',
  siteMetadata: {
    siteUrl: 'https://docs.mergify.com'
  },
  plugins
};

export default config;
