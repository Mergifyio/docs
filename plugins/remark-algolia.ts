import { visit } from 'unist-util-visit';
import configSchema from '../public/mergify-configuration-openapi.json';
import { toString } from 'hast-util-to-string';
import algoliasearch from 'algoliasearch';
import type * as unified from 'unified';
import type * as mdast from 'mdast';

interface PageData {
	headings: Array<{ value: string; depth: number }>;
	tables: any[];
	objectID: string;
	excerpt: string;
	title: string;
	description: string;
}

async function savePageToAlgolia(pageData: PageData) {
	if (process.env.NODE_ENV !== 'production') return;
	console.info('Starting indexing on algolia...');

	const client = algoliasearch(process.env.GATSBY_ALGOLIA_APP_ID, process.env.ALGOLIA_WRITE_KEY);
	const index = client.initIndex('docs-pages');

	console.info(`Indexing page: ${pageData.objectID}`);
	await index.saveObject(pageData);
}

function getPath(path: string) {
	return path.slice(path.indexOf('/docs/') + 5, path.length);
}

export function remarkAlgolia(): unified.Plugin<[], mdast.Root> {
	const transformer: unified.Transformer<mdast.Root> = async (tree, file) => {
		const tables = [];
		const headings = [];

		visit(tree, 'heading', (heading) => {
			headings.push({
				depth: heading.depth,
				value: toString(heading as any),
			});
		});

		visit(tree, 'mdxJsxFlowElement', (element) => {
			switch (element.name) {
				case 'OptionsTable':
					const name = element.attributes.find(
						(attr) => attr.type === 'mdxJsxAttribute' && attr.name === 'name'
					).value;
					const optionsTableData = configSchema?.definitions?.[name]?.properties;

					tables.push({
						node: JSON.stringify(element),
						data: JSON.stringify(optionsTableData),
						content: null,
					});
					break;

				case 'PullRequestAttributesTable':
					const pullRequestAttributes = configSchema?.definitions?.PullRequestAttribute?.enum;

					tables.push({
						node: JSON.stringify(element),
						data: JSON.stringify(pullRequestAttributes),
						content: null,
					});
					break;

				case 'ActionOptionsTable':
					const action = element.attributes.find(
						(attr) => attr.type === 'mdxJsxAttribute' && attr.name === 'action'
					).value;
					const actionOptions =
						configSchema?.definitions?.Actions?.properties?.[action]?.properties;

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

		savePageToAlgolia({
			headings,
			tables,
			objectID: getPath(file.history[0]),
			excerpt: toString(tree),
			...file.data.astro.frontmatter,
		});
	};

	return function attacher() {
		return transformer;
	};
}
