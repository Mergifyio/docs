import { load } from 'cheerio';
import type * as mdast from 'mdast';
import type * as unified from 'unified';
import { CONTINUE, visit } from 'unist-util-visit';
import Viz from 'viz.js';
import { Module, render } from 'viz.js/full.render.js';

const viz = new Viz({ Module, render });

const validLanguages = [`dot`, `circo`];

export function remarkGraphvizPlugin(): unified.Plugin<[], mdast.Root> {
  const codeNodes = [];

  const transformer: unified.Transformer<mdast.Root> = async (tree) => {
    visit(tree, `code`, (node) => {
      // Only act on languages supported by graphviz
      if (validLanguages.includes(node.lang) && !node.value?.includes('<svg')) {
        codeNodes.push({ node, attrString: node.meta });
      }
      return CONTINUE;
    });

    await Promise.all(
      codeNodes.map(async ({ node, attrString }) => {
        const { value, lang } = node;
        /** This transformer can try to re-transform nodes which are now SVG element, we need to prevent that */
        if (node.value?.includes('<svg')) return node;
        try {
          // Perform actual render
          const svgString = await viz.renderString(value, { engine: lang });
          // Add default inline styling
          const $ = load(svgString);
          $(`svg`).attr(`style`, `max-width: 100%; height: auto;`);
          // Merge custom attributes if provided by user (adds and overwrites)
          if (attrString) {
            const attrElement = load(`<element ${attrString}></element>`);
            $(`svg`).attr(attrElement(`element`).attr());
          }
          // Mutate the current node. Converting from a code block to
          // HTML (with svg content)
          node.type = `html`;
          node.value = $.html(`svg`);
        } catch (error) {
          console.log(`Error during viz.js execution. Leaving code block unchanged`);
          console.log(error);
        }

        return node;
      })
    );
  };

  return function attacher() {
    return transformer;
  };
}
