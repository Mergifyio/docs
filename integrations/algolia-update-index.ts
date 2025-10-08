import { algoliasearch } from 'algoliasearch';
import type { AstroIntegration } from 'astro';
import { getCollectedAlgoliaPages, type PageData } from '../plugins/remark-algolia';

export function AlgoliaUpdateIndex(): AstroIntegration {
  return {
    name: 'algolia-update-index',
    hooks: {
      'astro:build:done': async () => {
        const appId = process.env.PUBLIC_ALGOLIA_APP_ID;
        const writeKey = process.env.ALGOLIA_WRITE_KEY;
        const indexName = process.env.PUBLIC_ALGOLIA_INDEX_NAME;

        if (!appId || !writeKey || !indexName) {
          console.info('[Algolia] missing env, skip replaceAll');
          return;
        }

        const pages: PageData[] = getCollectedAlgoliaPages();
        console.info(`[Algolia] collected pages: ${pages.length}`);
        if (pages.length === 0) {
          return;
        }

        const client = algoliasearch(appId, writeKey) as any;
        await client.replaceAllObjects({ indexName, objects: pages, safe: true });
        console.info('[Algolia] Index updated.');
      },
    },
  };
}
