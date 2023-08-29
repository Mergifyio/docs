import Fuse from 'fuse.js';

import { Page } from './types';

export default function searchPage(pages: Page[], search: string) {
  const fuse = new Fuse(pages, {
    keys: ['childMdx.frontmatter.title', 'childMdx.frontmatter.description'],
    includeMatches: true,
    ignoreLocation: false,
    includeScore: true,
    threshold: 0.4,
    shouldSort: true,
  });
  return search ? fuse.search(search)
    : pages.map((page, index) => ({
      item: { ...page },
      matches: [],
      refIndex: index,
    })) as Fuse.FuseResult<Page>[];
}

export const getHighlightedMatches = (
  match: Fuse.FuseResultMatch | undefined,
  original: string,
) => {
  if (!match) return original;

  const startIndices = match.indices.map(([start]) => start);
  const endIndices = match.indices.map(([, end]) => end);

  const underlinedTextArray = [];
  for (let i = 0; i < original.length; i++) {
    if (startIndices.includes(i)) {
      underlinedTextArray.push('<u>');
    }
    underlinedTextArray.push(original[i]);
    if (endIndices.includes(i)) {
      underlinedTextArray.push('</u>');
    }
  }

  return underlinedTextArray?.join('');
};
