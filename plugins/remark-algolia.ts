import { algoliasearch } from 'algoliasearch';
import type * as mdast from 'mdast';
import { toString } from 'mdast-util-to-string';
import type * as unified from 'unified';
import { visit } from 'unist-util-visit';
import configSchema from '../src/util/sanitizedConfigSchema';

interface PageData {
  headings: Heading[];
  tables: any[];
  objectID: string;
  excerpt: string;
  title: string;
  description: string;
}

type AstroFrontmatter = {
  title: string;
  description: string;
};

type AlgoliaTable = {
  node: string;
  data: string | null;
  content: string | null;
};

type Heading = {
  value: string;
  depth: number;
};

async function savePageToAlgolia(pageData: PageData) {
  if (process.env.NODE_ENV !== 'production') return;
  const appId = process.env.PUBLIC_ALGOLIA_APP_ID;
  const writeKey = process.env.ALGOLIA_WRITE_KEY;
  const indexName = process.env.PUBLIC_ALGOLIA_INDEX_NAME;
  if (!writeKey || !appId || !indexName) {
    console.info('Missing Algolia env vars, skipping indexing');
    return;
  }

  console.info('Starting indexing on algolia...');

  const client = algoliasearch(appId, writeKey);
  console.info(`Indexing page: ${pageData.objectID}`);
  await client.saveObject({
    indexName: indexName,
    body: pageData as any,
  });
}

function getPath(path: string) {
  return path.slice(path.indexOf('/docs/') + 5, path.length);
}

/** Naive excerpt which concatenate every paragraph node to string */
function getExcerpt(tree: mdast.Root) {
  const excerpt: string[] = [];

  visit(tree, 'paragraph', (node) => {
    excerpt.push(toString(node));
  });

  return excerpt.join(' ');
}

export function remarkAlgolia(): unified.Plugin<[], mdast.Root> {
  const transformer: unified.Transformer<mdast.Root> = async (tree, file) => {
    const tables: AlgoliaTable[] = [];
    const headings: Heading[] = [];

    visit(tree, 'heading', (heading: mdast.Heading) => {
      headings.push({
        depth: heading.depth,
        value: toString(heading),
      });
    });

    visit(tree, 'mdxJsxFlowElement', (element: any) => {
      switch (element.name) {
        case 'OptionsTable':
          const def = element.attributes.find(
            (attr) => attr.type === 'mdxJsxAttribute' && attr.name === 'def'
          ).value;

          const optionsTableData = configSchema?.$defs?.[def as string]?.properties;

          tables.push({
            node: JSON.stringify(element),
            data: JSON.stringify(optionsTableData),
            content: null,
          });
          break;

        case 'PullRequestAttributesTable':
          const pullRequestAttributes = configSchema.$defs.PullRequestAttributes.properties;
          tables.push({
            node: JSON.stringify(element),
            data: JSON.stringify(pullRequestAttributes),
            content: null,
          });
          break;

        case 'ActionOptionsTable':
          const actionDef = element.attributes.find(
            (attr) => attr.type === 'mdxJsxAttribute' && attr.name === 'def'
          ).value;
          const actionOptions = configSchema?.$defs?.[actionDef as string]?.properties;

          tables.push({
            node: JSON.stringify(element),
            data: JSON.stringify(actionOptions),
            content: null,
          });
          break;
        case 'Table':
          tables.push({
            node: JSON.stringify(element),
            // For raw tables, we need the content as string
            // for algolia to search into
            content: toString(element),
            data: null,
          });
          break;
      }
    });

    const astroData = file.data.astro as {
      frontmatter: AstroFrontmatter;
    };
    savePageToAlgolia({
      headings,
      tables,
      objectID: getPath(file.history[0]),
      excerpt: getExcerpt(tree),
      ...astroData.frontmatter,
    });
  };

  return function attacher() {
    return transformer;
  };
}
