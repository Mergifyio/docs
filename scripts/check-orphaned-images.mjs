#!/usr/bin/env node
/**
 * Scan `src/content/` for images nothing references.
 *
 * Prose moves — a page is rewritten, an example is cut, a page is deleted
 * outright — and the image it imported is easy to leave behind, because
 * removing a page never fails a build the way removing a component does.
 * docs#12728 is the case that prompted this: it dropped a billing example's
 * two `<Image>` uses and both `import` lines, and the PNGs stayed on disk
 * with nothing pointing at them.
 *
 * A page imports an image by a relative path that always contains
 * `/images/<path from the nearest ancestor directory literally named
 * "images">` — `../../images/billing/plan.png`, `./images/hero.jpg`, three
 * levels up, one level up, it does not matter, that suffix is constant. So
 * for every image file that sits under some `images/` directory anywhere in
 * `src/content/`, this checks whether that exact suffix appears anywhere in
 * the docs source. No suffix found anywhere means nothing imports the file,
 * under any relative path. The leading `/` matters: it is what stops an
 * unrelated string like `cdn-images/billing/plan.png` from reading as a
 * reference to `images/billing/plan.png` just because one contains the
 * other.
 *
 * This deliberately does NOT match by basename alone: two images in
 * different directories can share a filename (`config-editor.png` exists
 * under both `configuration/` and, until it was deleted as part of this same
 * change, the removed `workflow/writing-your-first-rule/` page), and a
 * basename-only sweep reads the orphan as referenced because a same-named
 * file elsewhere genuinely is. That false negative is exactly how
 * `workflow/writing-your-first-rule/config-editor.png` survived a first,
 * basename-only pass.
 *
 * Nor does it assume images only live under `src/content/images/` — most do,
 * but `src/content/docs/images/merge-queue-hero.jpg` is a real, referenced
 * counterexample sitting right next to the page that imports it. Any
 * `images/` directory under `src/content/` counts.
 *
 * What it cannot see: an image loaded through `import.meta.glob` or any
 * other pattern that does not spell out the path literally. Nothing in the
 * docs does that today; if it starts, add the path to ALLOWLIST below rather
 * than trying to make the regex understand glob patterns.
 *
 * Two images under different `images/` roots can share the same suffix
 * (same subpath after the nearest `images/` ancestor) and so need the same
 * needle. `findOrphans` cannot tell which one an import actually resolves
 * to, so it reports every image in a colliding group rather than guessing.
 *
 * Usage:
 *   node scripts/check-orphaned-images.mjs
 *   node scripts/check-orphaned-images.mjs --json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');
const CONTENT_DIR = 'src/content';
const SEARCH_DIRS = ['src', 'integrations', 'plugins'];
const IMAGES_DIRNAME = 'images';
const SEARCH_EXTENSIONS = ['.mdx', '.md', '.astro', '.ts', '.tsx', '.js', '.mjs'];
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif'];

/**
 * Paths relative to the repo root that are known to be unreferenced on
 * purpose, each with why. Empty today — a legitimate entry should be rare,
 * since an image that nothing renders belongs in an asset host, not the
 * docs source tree.
 */
export const ALLOWLIST = new Set([]);

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

/**
 * Image files under any `images/` directory within `src/content/`, as paths
 * relative to the repo root (posix separators). A file with no `images/`
 * ancestor is outside this checker's scope: nothing imports an image by a
 * path containing `/images/` unless it sits under a directory named that.
 */
export function findImages(contentDir = path.join(ROOT, CONTENT_DIR)) {
  const found = [];
  for (const full of walk(contentDir)) {
    if (!IMAGE_EXTENSIONS.includes(path.extname(full).toLowerCase())) continue;
    const parts = path.relative(ROOT, full).split(path.sep);
    if (parts.includes(IMAGES_DIRNAME)) found.push(parts.join('/'));
  }
  return found.sort();
}

/**
 * The substring a relative import of `imagePath` (repo-relative, posix) must
 * contain: `/images/` through the rest of the path, taken from the nearest
 * `images` segment. Anchored on the leading slash so an unrelated
 * `cdn-images/...` cannot satisfy it by accident.
 */
export function needleFor(imagePath) {
  const parts = imagePath.split('/');
  const idx = parts.lastIndexOf(IMAGES_DIRNAME);
  return `/${parts.slice(idx).join('/')}`;
}

/** Concatenated text of every scanned source file under SEARCH_DIRS. */
export function buildCorpus(root = ROOT, dirs = SEARCH_DIRS) {
  let corpus = '';
  for (const dir of dirs) {
    const abs = path.join(root, dir);
    if (!fs.existsSync(abs)) continue;
    for (const full of walk(abs)) {
      if (SEARCH_EXTENSIONS.includes(path.extname(full).toLowerCase())) {
        corpus += fs.readFileSync(full, 'utf8');
        corpus += '\n';
      }
    }
  }
  return corpus;
}

/**
 * Images (repo-relative paths) that `corpus` never mentions, plus any image
 * whose needle collides with another image's — two images living under
 * different `images/` roots can end up with the identical suffix (e.g.
 * `src/content/images/billing/hero.png` and
 * `src/content/docs/images/billing/hero.png` both need `/images/billing/hero.png`),
 * and a single import of either would otherwise clear both regardless of
 * which one it actually references. Fail closed: a colliding pair is always
 * reported, even when the needle is present, so a human resolves the
 * ambiguity instead of the checker silently guessing.
 */
export function findOrphans(corpus, images = findImages(), allowlist = ALLOWLIST) {
  const needleCounts = new Map();
  for (const img of images) {
    const needle = needleFor(img);
    needleCounts.set(needle, (needleCounts.get(needle) ?? 0) + 1);
  }
  return images.filter((img) => {
    if (allowlist.has(img)) return false;
    const needle = needleFor(img);
    if (needleCounts.get(needle) > 1) return true;
    return !corpus.includes(needle);
  });
}

function main(argv) {
  const jsonMode = argv.includes('--json');

  const images = findImages();
  const corpus = buildCorpus();
  const orphans = findOrphans(corpus, images);

  if (jsonMode) {
    process.stdout.write(`${JSON.stringify(orphans, null, 2)}\n`);
    return orphans.length === 0 ? 0 : 1;
  }

  console.log(`Scanned ${images.length} image(s) under ${CONTENT_DIR}/**/${IMAGES_DIRNAME}/.`);
  if (orphans.length === 0) {
    console.log('No orphaned images found.');
    return 0;
  }
  console.error(`\n${orphans.length} orphaned image(s) — nothing imports them:\n`);
  for (const o of orphans) {
    console.error(`  ${o}`);
  }
  console.error(
    '\nDelete the file, or if the page that used it still needs it, restore the\n' +
      '`import` and `<Image>` that reference it. If it is genuinely unreferenced\n' +
      'on purpose, add it to ALLOWLIST in scripts/check-orphaned-images.mjs with why.'
  );
  return 1;
}

// Run as a CLI only when invoked directly, so tests can import the helpers.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
