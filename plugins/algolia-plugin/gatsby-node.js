const algoliasearch = require('algoliasearch');

const algoliaPagesQuery = `
{
  pages: allFile(filter: {extension: {in: ["md", "mdx"]}}) {
    nodes {
      id
      childMdx {
        tableOfContents
        fields {
          slug
        }
        tables {
          node
          data
          content
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

function transformRecords({data}) {
  return data.pages.nodes.map(node => {
    const { childMdx, id, ...rest} = node;
    delete rest.childMdx;

    return {
      ...childMdx,
      ...rest,
      objectID: id,
    }
  })
}

exports.onPostBuild = async ({ graphql, reporter }) => {
  reporter.info('Starting indexing on algolia...')
  const client = algoliasearch(process.env.GATSBY_ALGOLIA_APP_ID, process.env.ALGOLIA_WRITE_KEY);
  const index = client.initIndex('docs-pages-dev')
  const data = await graphql(algoliaPagesQuery);
  const pages = transformRecords(data);
  
  reporter.info(`Indexing ${pages.length} records`)

  await index.saveObjects(pages)

  reporter.success('Done indexing records on algolia.')
};