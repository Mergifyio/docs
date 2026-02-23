export interface PagefindResult {
  id: string;
  url: string;
  excerpt: string;
  meta: { title: string; pageTitle?: string; headingPath?: string; image?: string };
  sub_results: PagefindSubResult[];
  content: string;
}

export interface PagefindSubResult {
  title: string;
  url: string;
  excerpt: string;
  anchor?: { element: string; id: string; text: string };
}

export interface PagefindSearchResult {
  id: string;
  data: () => Promise<PagefindResult>;
}

export interface PagefindInstance {
  search: (query: string) => Promise<{ results: PagefindSearchResult[] }>;
  debouncedSearch: (
    query: string,
    options?: Record<string, unknown>,
    ms?: number
  ) => Promise<{ results: PagefindSearchResult[] } | null>;
  preload: (query: string) => Promise<void>;
  init: () => Promise<void>;
}

/** A search entry displayed in the results list. */
export interface SearchEntry {
  id: string;
  url: string;
  title: string;
  excerpt: string;
  pageTitle: string;
  pageUrl: string;
  breadcrumb: string;
}
