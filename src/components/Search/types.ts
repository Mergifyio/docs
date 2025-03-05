import { SearchResponse } from '@algolia/client-search';

export type Heading = {
	depth: string;
	value: string;
};

// copied from @algolia/client-search as the type is not exported
declare type SnippetMatch = {
	readonly value: string;
	readonly matchLevel: 'none' | 'partial' | 'full';
};

export type Page = {
	objectID: string;
	title: string;
	description: string;
	tables: {
		node: string;
		data: string | null;
		content: string | null;
	}[];
	headings: Heading[];
	excerpt?: SnippetMatch;
};

export type AlgoliaResult = SearchResponse<Page>['hits'][number];
