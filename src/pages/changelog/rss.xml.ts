import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { sortChangelog } from '../../util/changelog';

export async function GET(context: APIContext) {
  const entries = sortChangelog(await getCollection('changelog'));

  return rss({
    title: 'Mergify Changelog',
    description: 'Latest product updates from Mergify',
    site: context.site || 'https://docs.mergify.com',
    items: entries.map((entry) => {
      return {
        title: `${entry.data.title}`,
        description: entry.data.description || '',
        content: entry.data.description || '',
        pubDate: new Date(entry.data.date),
        link: `/changelog/${entry.slug}/`,
        categories: entry.data.tags || [],
        author: 'hello@mergify.com (Mergify)',
      };
    }),
    customData: `
      <language>en-us</language>
      <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
      <docs>https://docs.mergify.com/changelog</docs>
      <webMaster>hello@mergify.com (Mergify)</webMaster>
      <image>
        <url>https://docs.mergify.com/favicon.svg</url>
        <title>Mergify Changelog</title>
        <link>https://docs.mergify.com/changelog</link>
      </image>
    `,
  });
}
