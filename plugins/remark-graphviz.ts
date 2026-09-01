import { instance } from '@viz-js/viz';
import { load } from 'cheerio';
import type * as mdast from 'mdast';
import type * as unified from 'unified';
import { CONTINUE, visit } from 'unist-util-visit';

/**
 * Render `dot` / `circo` / `neato` fences to inline SVG, and hand every colour
 * decision to CSS.
 *
 * Graphviz supports a `class` attribute on graphs, nodes, edges and clusters
 * and copies it verbatim into the SVG (`class="node queued"`). So this plugin
 * never resolves a colour: it injects shape and spacing defaults, drops the
 * opaque canvas, tags each element with a *role*, and strips the inline paint
 * so the `.dg` rules in `index.css` resolve surface, border and label at paint
 * time from the role accents in `theme.css`. Dark mode then arrives through the
 * same `:root.theme-dark` block as every other surface on the site, with no
 * second render and no string matching.
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
  graph [bgcolor="transparent", fontname="${METRICS_FONT}", fontsize=13,
         labelloc="t", pad="0.12", nodesep=0.45, ranksep=0.55];
  node  [fontname="${METRICS_FONT}", fontsize=13, shape=box,
         style="rounded,filled", penwidth=1.4, margin="0.24,0.15", height=0.42];
  edge  [fontname="${METRICS_FONT}", fontsize=10, penwidth=1.3, arrowsize=0.7];
`;

/**
 * The classes Graphviz puts on an element itself. Anything else on the element
 * came from the fence, and means the author named the element's role.
 */
const STRUCTURAL_CLASSES = new Set(['graph', 'node', 'edge', 'cluster']);

/**
 * Transitional: the colours the docs were drawn with, mapped onto roles.
 *
 * Four independent dialects grew here — queue-green, emoji-pastel,
 * nineties-pastel and near-white-blueprint — because there was no palette to be
 * consistent with. This table maps by the hue family each dialect used, so two
 * elements drawn in the same colour still read alike. It is lossy in the other
 * direction: where one dialect used two shades of a hue for two meanings, both
 * land on one role — PostgreSQL and Redis both become `datastore`, and
 * "tests passed" and "merged to main" both become `merged`. That is the price
 * of recolouring the whole corpus without editing a single fence, and it is
 * paid back one page at a time as each fence names its own roles.
 *
 * It is a migration shim with a known end: once every fence names its own role,
 * nothing reaches this table and it goes away. Keys are lowercase hex.
 */
const LEGACY_ROLES: Record<string, string> = {
  // Queue dialect — batches, performance, stacks, queue-modes, scopes,
  // direct-merge, gha, buildkite.
  '#347d39': 'queued', // queue green: a pull request in the queue
  '#1cb893': 'config', // Merge Queue teal, as a node: a scope or a config value
  '#6b7280': 'muted', // skipped, waiting, not selected
  '#9ca3af': 'muted', // cascaded out, dashed side-links
  '#111827': 'external', // CI, ci-gate, main
  '#0b1120': 'external',
  '#2563eb': 'pending', // the detect-scopes step, mid-run
  '#dc2626': 'failed',
  '#374151': 'chrome', // the edge colour the old plugin string-matched
  '#4b5563': 'chrome',
  '#5b21b6': 'chrome', // stacks: edges and their labels

  // Emoji-pastel dialect — lifecycle, two-step.
  '#f3f4f6': 'external', // dequeued: out of the queue
  '#fff4ed': 'pending', // queueing, validating, testing
  '#ede9fe': 'queued',
  '#f3e8ff': 'queued', // the queue command
  '#dbeafe': 'config',
  '#d1fae5': 'merged',
  '#ddd6fe': 'merged', // merged to main
  '#fee2e2': 'failed',
  '#10b981': 'merged', // the "passed" edge
  '#ef4444': 'failed', // the "failed" edge
  '#7c3aed': 'chrome', // the default edge colour on both pages

  // Nineties-pastel dialect — flaky-test-detection.
  '#c9e7f8': 'config', // the commit under test
  '#b7f5c1': 'merged', // tests passed
  '#f8c9c9': 'failed', // tests failed
  '#d8f0ff': 'external', // "consistent (not flaky)"
  '#ffe9b3': 'pending', // "flagged as flaky"
  '#999999': 'muted', // the dashed commit clusters

  // Near-white-blueprint dialect — enterprise/architecture.
  '#f6f8fb': 'external', // the default node fill
  '#ffffff': 'external', // GitHub
  '#24292e': 'external',
  '#fff3d6': 'config', // the reverse proxy: the entry point
  '#e6f0ff': 'mergify', // dashboard and workers
  '#f0ecfe': 'mergify', // the subscription API
  '#f4fbff': 'mergify', // the on-premise cluster
  '#e4f5ed': 'datastore', // PostgreSQL
  '#fce3e8': 'datastore', // Redis
  '#fdfeff': 'batch', // the customer-infrastructure cluster
  '#8892bf': 'chrome',
};

/** A cluster reads its colour differently: teal is a container, not a value. */
const LEGACY_CLUSTER_ROLES: Record<string, string> = {
  ...LEGACY_ROLES,
  '#1cb893': 'batch',
};

/** Inject the base defaults immediately after the opening brace. */
function injectDefaults(source: string): string {
  const brace = source.indexOf('{');
  if (brace === -1) return source;
  return `${source.slice(0, brace + 1)}\n${BASE}\n${source.slice(brace + 1)}`;
}

/** The classes already on an element, as a list. */
function classesOf(value: string | undefined): string[] {
  return (value ?? '').split(/\s+/).filter(Boolean);
}

/**
 * Tag each node, edge and cluster with a role, and remove the inline paint so
 * `.dg` owns every colour.
 *
 * An element that names any class of its own is left alone — the author's
 * intent always wins over the substitution table, including when the class is
 * one this plugin does not recognise, because guessing a colour for an element
 * whose author already said something would silently contradict them.
 */
function applyRoles($: ReturnType<typeof load>): void {
  const tag = (
    selector: string,
    shapeSelector: string,
    table: Record<string, string>,
    colorAttr: 'fill' | 'stroke',
    fallbackAttr?: 'fill' | 'stroke'
  ) => {
    $(selector).each((_, element) => {
      const $group = $(element);
      const existing = classesOf($group.attr('class'));
      const $shape = $group.children(shapeSelector).first();

      const extra: string[] = [];

      // Graphviz draws no border for `shape=plaintext` / `shape=none`, so a
      // shape with no stroke is a caption rather than a box — even when the
      // node inherited `style=filled` and so came out with a fill behind it.
      // A node that asks for a fill and `color=none` is read the same way; use
      // `penwidth=0` to keep the fill.
      if ($shape.attr('stroke') === 'none' && !existing.includes('plain')) extra.push('plain');

      if (!existing.some((name) => !STRUCTURAL_CLASSES.has(name))) {
        const primary = $shape.attr(colorAttr);
        // A cluster drawn with `style=rounded` and no fill carries its colour
        // on the stroke instead. Only an absent or explicitly-none primary
        // falls through: an unmapped fill must not let a border speak for the
        // shape it merely outlines.
        const color =
          !primary || primary === 'none'
            ? ((fallbackAttr && $shape.attr(fallbackAttr)) ?? '')
            : primary;
        const role = table[color.toLowerCase()];
        if (role) extra.push(role);
      }

      if (extra.length > 0) $group.attr('class', [...existing, ...extra].join(' '));

      // Only direct children are painted by `.dg` in index.css; anything deeper
      // keeps whatever Graphviz gave it.
      $group
        .children()
        .removeAttr('fill')
        .removeAttr('stroke')
        .removeAttr('fill-opacity')
        .removeAttr('stroke-opacity');
    });
  };

  tag('g.node', 'path, polygon, ellipse', LEGACY_ROLES, 'fill');
  tag('g.cluster', 'path, polygon', LEGACY_CLUSTER_ROLES, 'fill', 'stroke');
  tag('g.edge', 'path', LEGACY_ROLES, 'stroke');
}

/** Post-process one rendered Graphviz SVG into a themeable `.dg` diagram. */
function themeDiagram($: ReturnType<typeof load>, classes: string[]): void {
  // Graphviz paints an opaque canvas as the first child of the graph group
  // whenever a fence sets its own `bgcolor`. Drop it so the page shows through.
  $('svg > g.graph > polygon').first().remove();

  // The graph-level caption sits directly under the graph group.
  $('svg > g.graph > text').removeAttr('fill');

  applyRoles($);

  $('svg').attr('class', ['dg', ...classes].join(' '));
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
          const classes = classesOf(attrs?.attr('class'));

          const svgString = viz.renderString(injectDefaults(node.value), {
            format: 'svg',
            engine: lang,
          });
          const $ = load(svgString);

          // Merge the fence's own attributes first — `class` is then recomputed
          // from them, so a fence can add a kind without losing `dg`.
          const fenceAttrs = attrs?.attr();
          if (fenceAttrs) $(`svg`).attr(fenceAttrs);
          themeDiagram($, classes);

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
