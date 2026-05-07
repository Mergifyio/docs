/**
 * Register all icons used in React components with Iconify's offline cache.
 *
 * Using @iconify/react with addCollection() serves icons entirely from the
 * locally installed @iconify-json/* packages, with no runtime network requests.
 *
 * Import this module once in any React component tree — addCollection() is
 * idempotent and the results are cached globally.
 */
import { addCollection } from '@iconify/react';
import type { IconifyJSON } from '@iconify/types';
import lucideData from '@iconify-json/lucide/icons.json';
import octiconData from '@iconify-json/octicon/icons.json';

/** Build a partial collection containing only the named icons. */
function pick(data: IconifyJSON, names: string[]): IconifyJSON {
  return {
    prefix: data.prefix,
    width: data.width,
    height: data.height,
    icons: Object.fromEntries(names.filter((n) => data.icons[n]).map((n) => [n, data.icons[n]])),
  };
}

addCollection(
  pick(lucideData as IconifyJSON, [
    'boxes',
    'clock',
    'coins',
    'corner-down-left',
    'gauge',
    'history',
    'moon',
    'search',
    'shield-check',
    'split',
    'sun',
  ])
);
addCollection(pick(octiconData as IconifyJSON, ['git-pull-request-16']));
