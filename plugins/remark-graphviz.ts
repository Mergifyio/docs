import { instance } from '@viz-js/viz';
import { load } from 'cheerio';
import type * as mdast from 'mdast';
import type * as unified from 'unified';
import { CONTINUE, visit } from 'unist-util-visit';

const viz = await instance();

const validLanguages = [`dot`, `circo`, `neato`];

// Layered style defaults injected into dot blocks based on their CSS classes.
// Diagrams can override any of these by redeclaring the same attributes.
const themes: Record<string, string> = {
  // Base theme: applied to all class="graph" blocks
  graph: `
    fontname="sans-serif";
    node [fontname="sans-serif", style=filled, fontcolor="white"];
    edge [fontname="sans-serif", color="#374151"];
  `,
  // Git commit graph: circles on a left-to-right line
  'git-commits': `
    rankdir="LR";
    splines=line;
    node [shape=circle, width=0.5, height=0.5, fixedsize=true];
  `,
};

function injectDefaults(source: string, attrString: string | null): string {
  if (!attrString?.includes('graph')) return source;

  const braceIndex = source.indexOf('{');
  if (braceIndex === -1) return source;

  // Build the defaults string by layering matching themes
  let defaults = '';
  for (const [key, value] of Object.entries(themes)) {
    if (attrString.includes(key)) {
      defaults += value;
    }
  }

  return `${source.slice(0, braceIndex + 1)}${defaults}${source.slice(braceIndex + 1)}`;
}

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
          // Inject theme defaults for class="graph" blocks
          const source = injectDefaults(value, attrString);
          // Perform actual render
          const svgString = viz.renderString(source, { format: 'svg', engine: lang });
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
