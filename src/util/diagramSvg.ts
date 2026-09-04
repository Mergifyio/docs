import type { load } from 'cheerio';

type CheerioAPI = ReturnType<typeof load>;

/**
 * Shared post-processing for the two Graphviz surfaces on the site: the `dot`
 * fences (`plugins/remark-graphviz.ts`) and the `<GitGraph>` component.
 *
 * Both used to strip the canvas and rewrite colours their own way, with their
 * own list of hex strings, which is how they drifted apart. Neither handles
 * colour now: this drops the canvas, strips the inline paint, and leaves the
 * `class` attribute Graphviz copied out of the source for the `.dg` rules in
 * `index.css` to resolve at paint time.
 */

/** The kinds of element `.dg` paints, and the Graphviz group class for each. */
export type DiagramKind = 'node' | 'edge' | 'cluster';

/**
 * Roles a diagram may name. `plain` is a shape marker rather than a colour: it
 * says the element is a caption, not a box.
 *
 * Every role here has a `.dg .<role>` rule in `index.css` pointing at a
 * `--dg-a-<role>` accent in `theme.css`, except `plain`.
 */
export const DIAGRAM_ROLES = [
  'chrome',
  'muted',
  'batch',
  'external',
  'queued',
  'pending',
  'merged',
  'failed',
  'config',
  'mergify',
  'datastore',
] as const;

export type DiagramRole = (typeof DIAGRAM_ROLES)[number];

interface FinishOptions {
  /** Classes for the `<svg>`, after `dg`. */
  classes?: string[];
}

/** The shapes Graphviz draws directly inside each kind of group. */
const SHAPES: Record<DiagramKind, string> = {
  node: 'path, polygon, ellipse',
  cluster: 'path, polygon',
  edge: 'path',
};

const classesOf = (value: string | undefined): string[] =>
  (value ?? '').split(/\s+/).filter(Boolean);

/**
 * Turn a rendered Graphviz SVG into a themeable `.dg` diagram, in place.
 */
export function finishDiagramSvg($: CheerioAPI, { classes = [] }: FinishOptions = {}) {
  // Graphviz paints an opaque canvas as the first child of the graph group
  // whenever the source sets its own `bgcolor`. Drop it so the page shows
  // through — otherwise the diagram carries a light rectangle into dark mode.
  $('svg > g.graph > polygon').first().remove();

  // The graph-level caption sits directly under the graph group.
  $('svg > g.graph > text').removeAttr('fill');

  for (const kind of Object.keys(SHAPES) as DiagramKind[]) {
    $(`g.${kind}`).each((_, element) => {
      const $group = $(element);
      const existing = classesOf($group.attr('class'));
      const $shape = $group.children(SHAPES[kind]).first();

      // Graphviz draws no border for `shape=plaintext` / `shape=none`, so a
      // shape with no stroke is a caption rather than a box — even when it
      // inherited `style=filled` and so came out with a fill behind it. A shape
      // that asks for a fill and `color=none` is read the same way; use
      // `penwidth=0` to keep the fill.
      if ($shape.attr('stroke') === 'none' && !existing.includes('plain')) {
        $group.attr('class', [...existing, 'plain'].join(' '));
      }

      // Only direct children are painted by `.dg` in index.css; anything deeper
      // keeps whatever Graphviz gave it.
      $group
        .children()
        .removeAttr('fill')
        .removeAttr('stroke')
        .removeAttr('fill-opacity')
        .removeAttr('stroke-opacity');
    });
  }

  $('svg').attr('class', ['dg', ...classes].join(' '));
}
