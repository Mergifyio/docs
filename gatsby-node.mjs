import {
  createFilePath,
} from 'gatsby-source-filesystem';
import {join, resolve} from 'path';
import {v5} from 'uuid';
import { compileMDXWithCustomOptions } from 'gatsby-plugin-mdx';
import { remarkHeadingsPlugin } from './remark-headings-plugin.mjs';
import redirects from './redirects.json' assert {
  type: 'json'
}
import {generateImage} from './generate-og-images.mjs';

export const onCreateWebpackConfig = ({ actions, stage, plugins }) => {
  actions.setWebpackConfig({
    devtool: "cheap-module-source-map",
    cache: true,
    watchOptions: {
      poll: 500,
      aggregateTimeout: 300,
    },
    resolve: {
      fallback: {
        "stream": false,
        "path": false,
        "process": false,
        "url": false
      }
    }
  });

  if (stage === 'build-javascript' || stage === 'develop') {
    actions.setWebpackConfig({
      plugins: [
        plugins.provide({ process: 'process/browser' })
      ]
    })
  }
}

export const onCreateNode = async ({node, getNode, loadNodeContent, actions}) => {
  const {type, mediaType} = node.internal;
  switch (type) {
    case 'File':
      if (mediaType === 'application/json') {
        // save the raw content of JSON files as a field
        const content = await loadNodeContent(node);
        actions.createNodeField({
          node,
          name: 'content',
          value: content
        });
      }
      break;
    case 'MarkdownRemark':
    case 'Mdx': {
      // add slugs for MD/MDX pages based on their file names
      const filePath = createFilePath({
        node,
        getNode
      });

      const {sourceInstanceName} = getNode(node.parent);
      actions.createNodeField({
        node,
        name: 'slug',
        // prefix slugs with their docset path (configured by source name)
        value: join('/', sourceInstanceName, filePath)
      });
      break;
    }
    default:
  }
};

export const createPages = async ({actions, graphql}) => {
  const pageTemplate = resolve("./src/templates/page.jsx")
  const {createRedirect} = actions;

  redirects.forEach(redirect => {
    createRedirect({
      ...redirect,
      isPermanent: true
    })
  })

  const {data} = await graphql(`
    {
      pages: allFile(filter: {extension: {in: ["md", "mdx"]}}) {
        nodes {
          id
          absolutePath
          sourceInstanceName
          children {
            ... on Mdx {
              frontmatter {
                title
              }
              fields {
                slug
              }
            }
          }
        }
      }
      tags: allMdx {
        group(field: {frontmatter: {tags: SELECT}}) {
          name: fieldValue
        }
      }
    }
  `);


  await Promise.all(data.pages.nodes.map(async ({id, children, absolutePath}) => {
    const [{fields, frontmatter}] = children;

    if (fields.slug === '/')
      await generateImage('Home', fields.slug)
    else
      await generateImage(frontmatter.title, fields.slug)

    await actions.createPage({
      path: fields.slug,
      component: `${pageTemplate}?__contentFilePath=${absolutePath}`,
      context: {
        id,
      }
    });
  }))
};

export const createSchemaCustomization = async ({ getNode, getNodesByType, pathPrefix, reporter, cache, actions, schema, store }) => {
  const { createTypes } = actions

  const headingsResolver = schema.buildObjectType({
    name: `Mdx`,
    fields: {
      headings: {
        type: `[MdxHeading]`,
        async resolve(mdxNode) {
          const fileNode = getNode(mdxNode.parent)

          if (!fileNode) {
            return null
          }

          const result = await compileMDXWithCustomOptions(
            {
              source: mdxNode.body,
              absolutePath: fileNode.absolutePath,
            },
            {
              pluginOptions: {},
              customOptions: {
                mdxOptions: {
                  remarkPlugins: [remarkHeadingsPlugin],
                },
              },
              getNode,
              getNodesByType,
              pathPrefix,
              reporter,
              cache,
              store,
            }
          )

          if (!result) {
            return null
          }

          return result.metadata.headings
        }
      }
    }
  })

  createTypes([
    `
      type MdxHeading {
        value: String
        depth: Int
      }
    `,
    headingsResolver,
  ])
}
