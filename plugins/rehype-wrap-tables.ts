import type { Element, Root } from 'hast';
import { h } from 'hastscript';
import type { Plugin, Transformer } from 'unified';
import { CONTINUE, SKIP, visit } from 'unist-util-visit';

/**
 * Wraps each `<table>` in `<div class="table-wrap">` so the docs default
 * styling can apply a rounded border to the wrapper and the table itself
 * can scroll horizontally on narrow viewports.
 *
 * Handles both:
 * - hast `element` nodes — markdown tables and HTML `<table>` parsed as HTML
 * - `mdxJsxFlowElement` nodes — literal `<table>` JSX in MDX files
 */
export function rehypeWrapTables(): Plugin<[], Root> {
  const transformer: Transformer<Root> = (tree) => {
    visit(tree, (node, index, parent) => {
      if (!parent || typeof index !== 'number') return CONTINUE;
      const isElementTable = node.type === 'element' && (node as Element).tagName === 'table';
      const isMdxJsxTable =
        node.type === 'mdxJsxFlowElement' && (node as { name?: string }).name === 'table';
      if (!isElementTable && !isMdxJsxTable) return CONTINUE;
      parent.children[index] = h('div', { className: ['table-wrap'] }, node);
      return SKIP;
    });
  };

  return function attacher() {
    return transformer;
  };
}
