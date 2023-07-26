import {
  createFilePath,
  createRemoteFileNode
} from 'gatsby-source-filesystem';
import {join, resolve} from 'path';
import {v5} from 'uuid';
import { compileMDXWithCustomOptions } from 'gatsby-plugin-mdx';
import { remarkHeadingsPlugin } from './remark-headings-plugin.mjs';

export const onCreateWebpackConfig = ({ actions, stage, plugins }) => {
  actions.setWebpackConfig({
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

const getNavItems = items =>
  // turn a sidebar configuration object to an array of nav items
  Object.entries(items).map(([title, path]) =>
    typeof path === 'string'
      ? {title, path} // links are treated normally
      : {
          title,
          // generate an id for each group, for use with the sidebar nav state
          id: v5(JSON.stringify(path), v5.DNS),
          // recurse over its children and turn them into nav items
          children: getNavItems(path)
        }
  );

export const createPages = async ({actions, graphql}) => {
  const pageTemplate = resolve("./src/templates/page.jsx")

  const {data} = await graphql(`
    {
      pages: allFile(filter: {extension: {in: ["md", "mdx"]}}) {
        nodes {
          id
          absolutePath
          sourceInstanceName
          children {
            ... on Mdx {
              fields {
                slug
              }
            }
          }
        }
      }
      configs: allFile(filter: {base: {eq: "config.json"}}) {
        nodes {
          fields {
            content
          }
          sourceInstanceName
        }
      }
      tags: allMdx {
        group(field: {frontmatter: {tags: SELECT}}) {
          name: fieldValue
        }
      }
    }
  `);

  const configs = data.configs.nodes.reduce((acc, node) => {
    const {title, sidebar} = JSON.parse(
      node.fields.content
    );
    return {
      ...acc,
      [node.sourceInstanceName]: {
        docset: title,
        navItems: getNavItems(sidebar),
      }
    };
  }, {});

  data.pages.nodes.forEach(({id, sourceInstanceName, children, absolutePath}) => {
    const [{fields}] = children;

    actions.createPage({
      path: fields.slug,
      component: `${pageTemplate}?__contentFilePath=${absolutePath}`,
      context: {
        id,
        ...configs[sourceInstanceName]
      }
    });
  });
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
