import { visit } from 'unist-util-visit';
import configSchema from '../public/mergify-configuration-schema.json';
import { toString } from 'mdast-util-to-string';
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
	if (!process.env.ALGOLIA_WRITE_KEY) {
		console.info('No Algolia write key found, skipping indexing');
		return;
	}
		
	console.info('Starting indexing on algolia...');

	const client = algoliasearch(process.env.PUBLIC_ALGOLIA_APP_ID, process.env.ALGOLIA_WRITE_KEY);
	const index = client.initIndex(process.env.PUBLIC_ALGOLIA_INDEX_NAME);
	console.info(`Indexing page: ${pageData.objectID}`);
	await index.saveObject(pageData);
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
		const tables = [];
		const headings = [];

		visit(tree, 'heading', (heading) => {
			headings.push({
				depth: heading.depth,
				value: toString(heading),
			});
		});

		visit(tree, 'mdxJsxFlowElement', (element) => {
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

		savePageToAlgolia({
			headings,
			tables,
			objectID: getPath(file.history[0]),
			excerpt: getExcerpt(tree),
			...file.data.astro.frontmatter,
		});
	};

	return function attacher() {
		return transformer;
	};
}
