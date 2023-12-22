import { SearchResponse } from '@algolia/client-search';

export type Heading = {
	depth: string;
	value: string;
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
};

export type AlgoliaResult = SearchResponse<Page>['hits'][number];
