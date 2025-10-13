import { HighlightResult, SearchResponse } from '@algolia/client-search';

export type Hierarchy = {
  lvl0: string | null;
  lvl1: string | null;
  lvl2: string | null;
  lvl3: string | null;
};

// Base record structure (what gets indexed in Algolia)
export interface AlgoliaRecord {
  objectID: string;
  url: string;
  type: 'page' | 'H1' | 'H2' | 'H3';
  pageTitle: string;
  hierarchy: Hierarchy;
  html: string;
  text: string;
  properties: string[];
  category: string;
  pageDescription: string;
}

// Search result type (base record + Algolia-added fields)
export type AlgoliaSearchResult = AlgoliaRecord & {
  _highlightResult?: {
    text?: HighlightResult;
    hierarchy?: {
      lvl1?: HighlightResult;
      lvl2?: HighlightResult;
      lvl3?: HighlightResult;
    };
  };
};

export type AlgoliaResult = SearchResponse<AlgoliaSearchResult>['hits'][number];
