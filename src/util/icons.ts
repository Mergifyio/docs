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
import biData from '@iconify-json/bi/icons.json';
import featherData from '@iconify-json/feather/icons.json';
import mdiData from '@iconify-json/mdi/icons.json';
import octiconData from '@iconify-json/octicon/icons.json';
import tablerData from '@iconify-json/tabler/icons.json';

/** Build a partial collection containing only the named icons. */
function pick(data: IconifyJSON, names: string[]): IconifyJSON {
  return {
    prefix: data.prefix,
    width: data.width,
    height: data.height,
    icons: Object.fromEntries(names.filter((n) => data.icons[n]).map((n) => [n, data.icons[n]])),
  };
}

addCollection(pick(biData as IconifyJSON, ['search', 'arrow-return-left']));
addCollection(pick(featherData as IconifyJSON, ['sun', 'moon']));
addCollection(
  pick(tablerData as IconifyJSON, [
    'packages',
    'arrows-split-2',
    'gauge',
    'shield-check',
    'coin',
    'clock',
  ])
);
addCollection(pick(octiconData as IconifyJSON, ['git-pull-request-16']));
addCollection(pick(mdiData as IconifyJSON, ['clock-outline']));
