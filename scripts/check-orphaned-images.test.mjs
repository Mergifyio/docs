import { describe, expect, it } from 'vitest';
import { buildCorpus, findImages, findOrphans, needleFor } from './check-orphaned-images.mjs';

describe('needleFor', () => {
  it('anchors on the nearest images/ ancestor, leading slash included', () => {
    expect(needleFor('src/content/images/billing/plan.png')).toBe('/images/billing/plan.png');
    expect(needleFor('src/content/docs/images/hero.jpg')).toBe('/images/hero.jpg');
  });
});

describe('findOrphans', () => {
  it('reports an image no import mentions', () => {
    const corpus = 'import hero from "../../images/other/hero.png"\n';
    expect(
      findOrphans(corpus, [
        'src/content/images/billing/plan.png',
        'src/content/images/other/hero.png',
      ])
    ).toEqual(['src/content/images/billing/plan.png']);
  });

  it('matches any relative import depth, not just one style', () => {
    const corpus = [
      'import a from "../../images/billing/plan.png"',
      'import b from "../../../images/ci-insights/token.png"',
      'import c from "./images/merge-queue-hero.jpg"',
    ].join('\n');
    expect(
      findOrphans(corpus, [
        'src/content/images/billing/plan.png',
        'src/content/images/ci-insights/token.png',
        'src/content/docs/images/merge-queue-hero.jpg',
      ])
    ).toEqual([]);
  });

  it('finds images outside src/content/images/, under any images/ directory', () => {
    // src/content/docs/images/merge-queue-hero.jpg is the real counterexample:
    // an image colocated with the page that imports it rather than living
    // under the shared src/content/images/ tree.
    const corpus = 'import hero from "./images/merge-queue-hero.jpg"\n';
    expect(findOrphans(corpus, ['src/content/docs/images/merge-queue-hero.jpg'])).toEqual([]);
    expect(findOrphans('', ['src/content/docs/images/merge-queue-hero.jpg'])).toEqual([
      'src/content/docs/images/merge-queue-hero.jpg',
    ]);
  });

  it('does not let a same-named file elsewhere hide a real orphan', () => {
    // Two images share a basename in different directories; only one is
    // imported. A basename-only check would call both referenced — this is
    // the false negative that let workflow/writing-your-first-rule/
    // config-editor.png survive a first, basename-only sweep.
    const corpus = 'import x from "../../images/configuration/config-editor.png"\n';
    const images = [
      'src/content/images/configuration/config-editor.png',
      'src/content/images/workflow/first-rule/config-editor.png',
    ];
    expect(findOrphans(corpus, images)).toEqual([
      'src/content/images/workflow/first-rule/config-editor.png',
    ]);
  });

  it('does not let a directory-prefix collision produce a false reference', () => {
    // "/images/a/logo.png" must not read as referenced by an import of
    // "images/prefix-a/logo.png" just because the shorter string is a
    // substring of the longer one everywhere except at the images/ anchor.
    const corpus = 'import x from "../../images/prefix-a/logo.png"\n';
    expect(findOrphans(corpus, ['src/content/images/a/logo.png'])).toEqual([
      'src/content/images/a/logo.png',
    ]);
  });

  it('does not let an unrelated cdn-images/ path satisfy the reference', () => {
    // Before the leading-slash anchor, "cdn-images/billing/plan.png" (no
    // slash before "images") would have contained "images/billing/plan.png"
    // as a plain substring and wrongly cleared the file.
    const corpus = 'See https://cdn-images/billing/plan.png for the source asset.\n';
    expect(findOrphans(corpus, ['src/content/images/billing/plan.png'])).toEqual([
      'src/content/images/billing/plan.png',
    ]);
  });

  it('honors the allowlist', () => {
    const corpus = '';
    const images = ['src/content/images/billing/plan.png'];
    expect(findOrphans(corpus, images, new Set(images))).toEqual([]);
  });

  it('reports an unreferenced .avif file', () => {
    const corpus = 'import hero from "../../images/other/hero.png"\n';
    expect(findOrphans(corpus, ['src/content/images/billing/plan.avif'])).toEqual([
      'src/content/images/billing/plan.avif',
    ]);
  });

  it('fails closed when two images share a needle, even if it is present', () => {
    // Same subpath after the nearest images/ ancestor, different roots — a
    // single import of either satisfies both needles, so which one is truly
    // referenced is ambiguous. Report both rather than clearing either.
    const corpus = 'import hero from "../../images/billing/hero.png"\n';
    const images = [
      'src/content/images/billing/hero.png',
      'src/content/docs/images/billing/hero.png',
    ];
    expect(findOrphans(corpus, images)).toEqual(images);
  });
});

describe('published docs', () => {
  it('contain no orphaned images', () => {
    const images = findImages();
    const corpus = buildCorpus();
    const orphans = findOrphans(corpus, images);
    if (orphans.length) {
      throw new Error(`Orphaned image(s) — nothing imports them:\n${orphans.join('\n')}`);
    }
    // Sanity: the scan actually walked the images tree.
    expect(images.length).toBeGreaterThan(50);
  });
});
