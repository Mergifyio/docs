// Node-only helpers for the x-has-data-type title↔anchor convention (they read
// the data-types page from disk). Kept separate from dataType.ts so
// components can import the marker readers without dragging node:fs into a
// client bundle.
import { readFileSync } from 'node:fs';
import type { Element, Root } from 'hast';
import rehypeSlug from 'rehype-slug';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { collectDataTypeTitles } from './dataType';
import { slugify } from './slugify';

const DATA_TYPES_MDX_URL = new URL('../content/docs/configuration/data-types.mdx', import.meta.url);

/**
 * The anchors rehype-slug will generate for the data-types page, computed by
 * running the same `rehype-slug` the site pipeline uses (astro.config.ts) —
 * same package, same version, so the anchor algorithm and its
 * duplicate-heading `-1` suffixing can never drift from what deploys.
 * MDX-specific syntax (imports, JSX tags, `{...}` expressions) parses as
 * paragraphs or raw nodes here rather than components, which is fine for
 * heading extraction: headings on the page are plain markdown.
 */
export function dataTypesHeadingAnchors(): Set<string> {
  const mdx = readFileSync(DATA_TYPES_MDX_URL, 'utf8');
  // Drop YAML frontmatter: its closing `---` would otherwise turn the
  // preceding lines into a phantom setext heading.
  const withoutFrontmatter = mdx.replace(/^---\n[\s\S]*?\n---\n/, '');

  const processor = unified().use(remarkParse).use(remarkRehype).use(rehypeSlug);
  const tree = processor.runSync(processor.parse(withoutFrontmatter)) as Root;

  const anchors = new Set<string>();
  visit(tree, 'element', (node: Element) => {
    if (/^h[1-6]$/.test(node.tagName) && typeof node.properties.id === 'string') {
      anchors.add(node.properties.id);
    }
  });
  return anchors;
}

/**
 * The documented-data-type markers in `schema` whose derived anchor
 * (slugified title) has no matching heading on the data-types page — every
 * entry is a dead link — plus any marked node missing the title the
 * derivation needs. Empty when the convention holds.
 */
export function missingDataTypeAnchors(schema: unknown): string[] {
  const anchors = dataTypesHeadingAnchors();
  const problems = new Set<string>();
  for (const title of collectDataTypeTitles(schema)) {
    if (title === undefined) {
      problems.add('(x-has-data-type node without a title)');
    } else if (!anchors.has(slugify(title))) {
      problems.add(`"${title}" → #${slugify(title)}`);
    }
  }
  return [...problems].sort();
}
