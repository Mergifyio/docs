import { OGImageRoute } from 'astro-og-canvas';
import { allPages } from '~/content';

/** Paths for all of our Markdown content we want to generate OG images for. */
const paths = process.env.SKIP_OG ? [] : allPages;

/** An object mapping file paths to file metadata. */
const pages = Object.fromEntries(paths.map(({ id, data }) => [id, { data, id }]));

export const { getStaticPaths, GET } = OGImageRoute({
  param: 'path',

  pages,

  getImageOptions: async (_, { data }: (typeof pages)[string]) => {
    return {
      title: data.title,
      description: data.description,
      dir: 'ltr',
      logo: {
        path: './src/logo-mergify-black.png',
        size: [250],
      },
      // Use a subtle grayscale background to complement the black logo
      bgGradient: [
        [245, 245, 245],
        [220, 220, 220],
      ],
      font: {
        title: {
          size: 78,
          families: ['Source Sans Pro'],
          weight: 'ExtraBold',
          // Black text for readability on the light gray background
          color: [0, 0, 0],
        },
        description: {
          size: 45,
          lineHeight: 1.25,
          families: ['Source Sans Pro'],
          weight: 'Normal',
          // Black text for readability on the light gray background
          color: [0, 0, 0],
        },
      },
      fonts: [
        './src/pages/open-graph/_fonts/source-sans-pro/source-sans-pro-latin-400-normal.woff',
        './src/pages/open-graph/_fonts/source-sans-pro/source-sans-pro-latin-900-normal.woff',
      ],
    };
  },
});
