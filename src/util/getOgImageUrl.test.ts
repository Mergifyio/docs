import { describe, expect, it, vi } from 'vitest';
import { getOgImageUrl } from './getOgImageUrl';

// `getOgImageUrl` looks a derived filename up in the set of images
// astro-og-canvas actually generated, which comes from the content collection
// and so needs the Astro build pipeline. Stub that set and test the derivation
// — the half where the homepage bug was.
vi.mock('../pages/open-graph/[...path]', () => ({
  getStaticPaths: async () => [
    { params: { path: 'index.png' } },
    { params: { path: 'merge-queue.png' } },
  ],
}));

describe('getOgImageUrl', () => {
  it('resolves the homepage to the index image', () => {
    // Regression: stripping the slashes off `/` left an empty slug, so the
    // homepage was the one page that shipped an empty `og:image`.
    expect(getOgImageUrl('/')).toBe('/open-graph/index.png');
  });

  it('resolves a normal page, with or without a trailing slash', () => {
    expect(getOgImageUrl('/merge-queue')).toBe('/open-graph/merge-queue.png');
    expect(getOgImageUrl('/merge-queue/')).toBe('/open-graph/merge-queue.png');
  });

  it('returns undefined when no image was generated', () => {
    expect(getOgImageUrl('/not-a-page')).toBeUndefined();
  });
});
