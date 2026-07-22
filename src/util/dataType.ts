import { slugify } from './slugify';

// The engine flags a schema node that corresponds to a documented Mergify
// data type with `x-has-data-type: true`. Everything else derives from the node's
// standard `title`: the link label is the title, and the link target is the
// slugified title, which by convention equals the section heading anchor on
// /configuration/data-types. The convention is enforced where drift can
// actually arrive: the Astro build fails when a marked title has no matching
// heading anchor (schema syncs land as direct pushes to main, so the deploy
// build is the gate), and dataType.test.ts gives the same signal earlier, in
// PR CI.
const DATA_TYPE_KEY = 'x-has-data-type';

const DATA_TYPES_PAGE = '/configuration/data-types';

export function isDataType(definition: unknown): boolean {
  return (
    !!definition &&
    typeof definition === 'object' &&
    (definition as Record<string, unknown>)[DATA_TYPE_KEY] === true
  );
}

export function getDataTypeHref(title: string): string {
  return `${DATA_TYPES_PAGE}#${slugify(title)}`;
}

/**
 * Walk a JSON schema and return the `title` of every node flagged
 * `x-has-data-type: true`, wherever the flag appears (inline property nodes,
 * `$ref` siblings, `$defs` entries, array items, `anyOf` branches). A marked
 * node without a title yields `undefined` — an invalid marker the anchor
 * check reports.
 */
export function collectDataTypeTitles(
  node: unknown,
  titles: (string | undefined)[] = []
): (string | undefined)[] {
  if (Array.isArray(node)) {
    for (const item of node) {
      collectDataTypeTitles(item, titles);
    }
    return titles;
  }

  if (node && typeof node === 'object') {
    if (isDataType(node)) {
      const title = (node as { title?: unknown }).title;
      titles.push(typeof title === 'string' ? title : undefined);
    }
    for (const value of Object.values(node)) {
      collectDataTypeTitles(value, titles);
    }
  }

  return titles;
}
