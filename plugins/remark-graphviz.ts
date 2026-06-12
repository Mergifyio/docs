import { instance } from '@viz-js/viz';
import { load } from 'cheerio';
import type * as mdast from 'mdast';
import type * as unified from 'unified';
import { CONTINUE, visit } from 'unist-util-visit';

const viz = await instance();

const validLanguages = [`dot`, `circo`, `neato`];

// Dark neutral colors used for structural chrome (edges, arrowheads, connector
// labels, cluster borders/labels). These vanish on the dark-mode surface, so we
// swap them for `currentColor` and let the page drive the value via
// --theme-diagram-edge. Saturated/product colors are intentional highlights and
// are left untouched. Compared case-insensitively.
const DARK_NEUTRALS = new Set([
  '#374151', // gray-700
  '#4b5563', // gray-600
  '#6b7280', // gray-500
  '#000000',
  'black',
  '#999999',
]);

/** Replace an element's stroke/fill with currentColor when it is a dark neutral. */
function themeNeutral($el: ReturnType<ReturnType<typeof load>>): void {
  for (const attr of ['stroke', 'fill'] as const) {
    const value = $el.attr(attr);
    if (value === undefined) {
      // Graphviz omits `fill` on default-black text (edge/cluster labels), so an
      // absent fill on a <text> is an implicit dark neutral that must be themed.
      if (attr === 'fill' && $el.is('text')) {
        $el.attr('fill', 'currentColor');
      }
      continue;
    }
    if (DARK_NEUTRALS.has(value.toLowerCase())) {
      $el.attr(attr, 'currentColor');
    }
  }
}

/**
 * Make the neutral structural chrome of a rendered Graphviz SVG theme-aware so
 * it stays legible in dark mode. Content nodes (their fills and labels) and
 * saturated edge colors are deliberately left alone.
 */
function themeDiagram($: ReturnType<typeof load>): void {
  // Drop the opaque canvas background so the page surface shows through.
  $('svg > g.graph > polygon').first().attr('fill', 'none').attr('stroke', 'none');

  // Edges: lines, arrowheads, and connector labels all sit on the page surface.
  $('g.edge').each((_, edge) => {
    $(edge)
      .find('path, polygon, text')
      .each((__, el) => themeNeutral($(el)));
  });

  // Clusters: only re-theme the border and label when the cluster has no fill,
  // so labels that sit on a tinted cluster background keep their color.
  $('g.cluster').each((_, cluster) => {
    const $cluster = $(cluster);
    const clusterFill = $cluster.find('> polygon').first().attr('fill');
    if (!clusterFill || clusterFill.toLowerCase() === 'none') {
      $cluster.find('polygon, path, text').each((__, el) => themeNeutral($(el)));
    }
  });

  // Graph-level captions (text rendered directly under the graph group).
  $('svg > g.graph > text').each((_, el) => themeNeutral($(el)));
}

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
          // Add default inline styling. `color` drives `currentColor` for the
          // neutral chrome re-themed in themeDiagram().
          const $ = load(svgString);
          $(`svg`).attr(
            `style`,
            `max-width: 100%; height: auto; color: var(--theme-diagram-edge);`
          );
          // Make structural chrome track the theme so diagrams read in dark mode.
          themeDiagram($);
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
