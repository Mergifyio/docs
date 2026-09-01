import { instance } from '@viz-js/viz';
import { load } from 'cheerio';
import type * as mdast from 'mdast';
import type * as unified from 'unified';
import { CONTINUE, visit } from 'unist-util-visit';
import { finishDiagramSvg } from '../src/util/diagramSvg';

/**
 * Render `dot` / `circo` / `neato` fences to inline SVG, and hand every colour
 * decision to CSS.
 *
 * Graphviz supports a `class` attribute on graphs, nodes, edges and clusters
 * and copies it verbatim into the SVG (`class="node queued"`). So this plugin
 * never resolves a colour and never names a role: the fence names them, and
 * the plugin only injects shape and spacing defaults, drops the opaque canvas
 * and strips the inline paint, so the `.dg` rules in `index.css` resolve
 * surface, border and label at paint time from the role accents in
 * `theme.css`. Dark mode then arrives through the same `:root.theme-dark`
 * block as every other surface on the site, with no second render and no
 * string matching.
 *
 * The one class the rendering side still adds is `plain`, in
 * `finishDiagramSvg` — a shape fact (this element is a caption, not a box),
 * not a colour.
 */

const viz = await instance();

const VALID_LANGUAGES = ['dot', 'circo', 'neato'];

/**
 * Metrics font. Graphviz sizes every box with its own Helvetica tables; the
 * page then paints the text in Inter via `.dg text`. The two differ by about
 * 3% in width, which the node margins below are generous enough to absorb.
 *
 * The node defaults assume a shape whose size is derived from its label. A
 * shape with fixed geometry — `shape=point` above all — is inflated by them and
 * needs its own `width`/`height` back.
 */
const METRICS_FONT = 'Helvetica';

/**
 * Injected into every fence, immediately after the opening brace, so anything
 * the author writes afterwards overrides it. `labelloc="t"` puts a graph-level
 * caption above the figure, where a figure caption belongs; Graphviz's own
 * default is below.
 */
const BASE = `
  graph [bgcolor="transparent", style="rounded", fontname="${METRICS_FONT}",
         fontsize=13, labelloc="t", pad="0.12", nodesep=0.45, ranksep=0.55];
  node  [fontname="${METRICS_FONT}", fontsize=13, shape=box,
         style="rounded,filled", penwidth=1.4, margin="0.24,0.15", height=0.42];
  edge  [fontname="${METRICS_FONT}", fontsize=10, penwidth=1.3, arrowsize=0.7];
`;

/**
 * Diagram kinds. A fence opts into one through its class — ```dot class="queue"
 * — and it sets layout, never colour. A fence that names none gets BASE alone
 * and lays itself out.
 */
const KINDS: Record<string, string> = {
  queue: `rankdir="LR"; splines="polyline"; nodesep=0.32; ranksep=0.45;`,
  flow: `rankdir="TB"; splines="spline"; nodesep=0.55; ranksep=0.6;`,
  arch: `rankdir="TB"; splines="ortho"; nodesep=0.8; ranksep=1.0;
         node [width=2.5, margin="0.34,0.24"];`,
};

/**
 * Inject the base defaults, plus any kind the fence opted into, immediately
 * after the opening brace, so anything the fence writes afterwards overrides
 * them. `Object.hasOwn` because the class comes from the fence: a fence
 * classed `constructor` would otherwise inject `Object`'s own into the DOT.
 */
function injectDefaults(source: string, classes: string[]): string {
  const brace = source.indexOf('{');
  if (brace === -1) return source;

  let defaults = BASE;
  for (const kind of classes) {
    if (Object.hasOwn(KINDS, kind)) defaults += `\n  ${KINDS[kind]}\n`;
  }

  return `${source.slice(0, brace + 1)}\n${defaults}\n${source.slice(brace + 1)}`;
}

export function remarkGraphvizPlugin(): unified.Plugin<[], mdast.Root> {
  const transformer: unified.Transformer<mdast.Root> = async (tree) => {
    const codeNodes: { node: mdast.Code; lang: string; attrString: string | undefined }[] = [];

    visit(tree, `code`, (node) => {
      // Only act on languages supported by graphviz. A node that already holds
      // an `<svg>` has been transformed on an earlier pass.
      const lang = node.lang ?? '';
      if (VALID_LANGUAGES.includes(lang) && !node.value?.includes('<svg')) {
        codeNodes.push({ node, lang, attrString: node.meta ?? undefined });
      }
      return CONTINUE;
    });

    await Promise.all(
      codeNodes.map(async ({ node, lang, attrString }) => {
        try {
          const attrs = attrString ? load(`<element ${attrString}></element>`)(`element`) : null;
          const classes = (attrs?.attr('class') ?? '').split(/\s+/).filter(Boolean);

          const svgString = viz.renderString(injectDefaults(node.value, classes), {
            format: 'svg',
            engine: lang,
          });
          const $ = load(svgString);

          // Merge the fence's own attributes first — `class` is then recomputed
          // from them, so a fence can add a kind without losing `dg`.
          const fenceAttrs = attrs?.attr();
          if (fenceAttrs) $(`svg`).attr(fenceAttrs);
          finishDiagramSvg($, { classes });

          // Rewrite the fence in place: it stops being a code block and becomes
          // the rendered SVG. mdast has no in-place conversion, so the node
          // itself is retyped — asserting the string into `Code['type']` would
          // claim `'html'` is `'code'` and leave the node lying about itself.
          const htmlNode = node as unknown as mdast.Html;
          htmlNode.type = `html`;
          htmlNode.value = $.html(`svg`);
        } catch (error) {
          // The fence survives as a code block rather than taking the build
          // down, so name it loudly: a diagram silently becoming a wall of DOT
          // is easy to miss in a 391-page build log.
          console.error(
            `remark-graphviz: leaving a ${lang} fence unrendered — ${node.value.split('\n')[0]}`
          );
          console.error(error);
        }

        return node;
      })
    );
  };

  return function attacher() {
    return transformer;
  };
}
