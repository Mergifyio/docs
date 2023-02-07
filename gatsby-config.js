const {
  remarkTypescript,
  highlightPreservation,
  isWrapped
} = require('remark-typescript');

const gatsbyRemarkPlugins = [
  '@fec/remark-a11y-emoji/gatsby',
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
  pathPrefix: '/' + process.env.PR_NUMBER + '/docs',
  plugins
};
