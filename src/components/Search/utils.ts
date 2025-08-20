import { HighlightResult, SnippetResult } from '@algolia/client-search';

export const extractResultValue = (item: HighlightResult | SnippetResult | undefined): string => {
  if (!item) return '';

  if ('value' in item) {
    return item.value as string;
  }

  return Object.values(item).map(extractResultValue).join(' ');
};

export default extractResultValue;
