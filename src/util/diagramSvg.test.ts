import { load } from 'cheerio';
import { describe, expect, it } from 'vitest';
import { finishDiagramSvg } from './diagramSvg';

/**
 * `finishDiagramSvg` is reached from two directions — the `dot` fences through
 * `plugins/remark-graphviz.ts`, and `<GitGraph>` — and only the first of them
 * has a test suite. These assertions run the post-processor on hand-written SVG
 * so the contract both callers depend on is pinned without going through
 * Graphviz.
 */

/** Post-process `svg` and hand back the serialized result. */
function finish(svg: string, classes?: string[]): string {
  const $ = load(svg, null, false);
  finishDiagramSvg($, classes ? { classes } : undefined);
  return $.html('svg');
}

/** The class list of the single `<g>` in a processed fragment. */
function groupClasses(html: string): string[] {
  const m = html.match(/<g class="([^"]*)"/);
  if (!m) throw new Error(`no classed group in ${html}`);
  return m[1].split(/\s+/);
}

describe('finishDiagramSvg', () => {
  it('drops the opaque canvas Graphviz paints behind the graph', () => {
    const out = finish(
      '<svg><g class="graph"><polygon fill="#ffffff" points="0,0 1,1"/>' +
        '<g class="node"><polygon fill="#eee" stroke="#111"/></g></g></svg>'
    );
    // The node's own polygon survives; only the first one under g.graph goes.
    expect(out).not.toContain('points="0,0 1,1"');
    expect(out).toContain('<polygon');
  });

  it('strips the fill off the graph-level caption so CSS can color it', () => {
    const out = finish('<svg><g class="graph"><text fill="#000000">Caption</text></g></svg>');
    expect(out).toContain('<text>Caption</text>');
  });

  it('marks a borderless shape as plain, so it reads as a caption not a box', () => {
    const out = finish('<svg><g class="node"><polygon fill="#eee" stroke="none"/></g></svg>');
    expect(groupClasses(out)).toContain('plain');
  });

  it('leaves a bordered shape unmarked', () => {
    const out = finish('<svg><g class="node"><polygon fill="#eee" stroke="#111"/></g></svg>');
    expect(groupClasses(out)).toEqual(['node']);
  });

  it('keeps the role the source named, and adds none of its own', () => {
    const out = finish('<svg><g class="node queued"><polygon stroke="#111"/></g></svg>');
    expect(groupClasses(out)).toEqual(['node', 'queued']);
  });

  it('strips the paint off direct children only', () => {
    const out = finish(
      '<svg><g class="edge"><path stroke="#347d39" stroke-opacity="0.5"/>' +
        '<a><path stroke="#347d39"/></a></g></svg>'
    );
    // `.dg` in index.css paints direct children, so anything deeper has to keep
    // what Graphviz gave it or it would render with no color at all.
    expect(out).toBe(
      '<svg class="dg"><g class="edge"><path></path><a><path stroke="#347d39"></path></a></g></svg>'
    );
  });

  it('names the svg `dg` plus the classes the caller passed', () => {
    expect(finish('<svg></svg>', ['queue', 'wide'])).toContain('class="dg queue wide"');
    expect(finish('<svg></svg>')).toContain('class="dg"');
  });
});
