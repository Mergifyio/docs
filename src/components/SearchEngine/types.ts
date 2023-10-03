import { SearchResponse } from '@algolia/client-search';

export type Heading = {
  items?: Heading[]
  url: string; // sluggish url of the heading
  title: string;
};

export type Page = {
  id: string;
  fields: {
    slug: string
  }
  excerpt: string;
  tableOfContents: Heading,
  frontmatter: {
    title: string;
    description: string;
    toc: boolean;
    tags: string;
  }
};

export type AlgoliaResult = SearchResponse<Page>['hits'][number];
