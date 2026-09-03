import type * as mdast from 'mdast';
import { describe, expect, it } from 'vitest';
import { remarkGraphvizPlugin } from './remark-graphviz';

type Transformer = (tree: mdast.Root) => Promise<void>;

/** The attacher takes a unified processor as `this`; the transformer needs none. */
const attach = (): Transformer =>
  (remarkGraphvizPlugin() as unknown as () => Transformer).call(undefined);

/** Run the plugin over a single fence and return the SVG it produced. */
async function render(value: string, meta: string | null = null): Promise<string> {
  const node: mdast.Code = { type: 'code', lang: 'dot', meta, value };
  const tree: mdast.Root = { type: 'root', children: [node] };
  await attach()(tree);
  // Without this, a fence that failed to render hands every assertion below the
  // raw DOT source instead of an SVG — and every negative assertion passes on
  // it. The one regression this suite exists to catch would report as working.
  expect(node.type).toBe('html');
  return (node as unknown as mdast.Html).value;
}

/** The class list of the `<g>` whose `<title>` names `id`. */
function classesOf(svg: string, id: string): string[] {
  for (const m of svg.matchAll(/<g[^>]*class="([^"]*)"[^>]*>\s*<title>([^<]*)<\/title>/g)) {
    if (m[2].replace(/&#45;/g, '-').replace(/&gt;/g, '>') === id) return m[1].split(/\s+/);
  }
  throw new Error(`no element titled ${id} in ${svg}`);
}

describe('remarkGraphvizPlugin', () => {
  it('renders a fence to an SVG carrying the dg class plus the fence classes', async () => {
    const svg = await render('digraph { A -> B; }', 'class="queue"');
    expect(svg).toMatch(/^<svg[^>]*class="dg queue"/);
  });

  it('leaves no colour in the output at all', async () => {
    const svg = await render(`digraph {
      node [style=filled, fillcolor="#347D39", fontcolor="white"];
      subgraph cluster_b { fillcolor="#1CB893"; style="rounded,filled"; label="Batch"; A; }
      A -> B [color="#374151"];
    }`);
    expect(svg).not.toMatch(/#[0-9a-f]{3,6}/i);
    expect(svg).not.toMatch(/\bfill="/);
    expect(svg).not.toMatch(/\bstroke="/);
  });

  it('maps the colours the docs were drawn with onto roles', async () => {
    const svg = await render(`digraph {
      node [style=filled];
      A [fillcolor="#347D39"];
      B [fillcolor="#6B7280"];
      C [fillcolor="#FFF4ED"];
      subgraph cluster_b { style="rounded,filled"; fillcolor="#1CB893"; label="Batch"; A; }
      A -> B [color="#9CA3AF"];
    }`);
    expect(classesOf(svg, 'A')).toContain('queued');
    expect(classesOf(svg, 'B')).toContain('muted');
    expect(classesOf(svg, 'C')).toContain('pending');
    // Teal is a container on a cluster and a value on a node.
    expect(classesOf(svg, 'cluster_b')).toContain('batch');
    expect(classesOf(svg, 'A->B')).toContain('muted');
  });

  it('reads a cluster drawn with a stroke and no fill', async () => {
    const svg = await render(`digraph {
      subgraph cluster_w { style="rounded"; color="#6B7280"; label="Waiting"; A; }
    }`);
    expect(classesOf(svg, 'cluster_w')).toContain('muted');
  });

  it('lets an authored role win over the substitution table', async () => {
    const svg = await render(`digraph {
      node [style=filled];
      A [fillcolor="#347D39", class="failed"];
    }`);
    expect(classesOf(svg, 'A')).toContain('failed');
    expect(classesOf(svg, 'A')).not.toContain('queued');
  });

  it('marks a borderless node as plain, so it reads as a caption', async () => {
    // `style=filled` reaches a plaintext node and puts a box behind the label;
    // the class is what lets CSS take it back off.
    const svg = await render(`digraph {
      node [style=filled];
      A [shape=plaintext, label="main"];
      B;
      A -> B;
    }`);
    expect(classesOf(svg, 'A')).toContain('plain');
    expect(classesOf(svg, 'B')).not.toContain('plain');
  });

  it('drops the opaque canvas a fence paints behind itself', async () => {
    const svg = await render('digraph { bgcolor="#FAFBFC"; A; }');
    expect(svg).not.toMatch(/<g id="graph0"[^>]*>\s*<polygon/);
  });

  it('injects defaults a fence can still override', async () => {
    const rounded = await render('digraph { A [label="x"]; }');
    // The injected `shape=box, style="rounded,filled"` draws a path, not a
    // polygon; asking for a plain box gets the polygon back.
    expect(rounded).toMatch(/<g id="node1"[^>]*>\s*<title>A<\/title>\s*<path/);
    const square = await render('digraph { node [style=filled]; A [label="x"]; }');
    expect(square).toMatch(/<g id="node1"[^>]*>\s*<title>A<\/title>\s*<polygon/);
  });

  it('does not let a border speak for the shape it outlines', async () => {
    // An unmapped fill must fall back to the element default, not to whatever
    // role the node's darker border happens to match.
    const svg = await render(`digraph {
      node [style=filled];
      A [fillcolor="#ABCDEF", color="#374151"];
    }`);
    expect(classesOf(svg, 'A')).toEqual(['node']);
  });

  it('does not guess a colour for an element whose author named a class', async () => {
    // Even an unrecognised class means the author said something; appending a
    // guessed role would contradict them with no warning.
    const svg = await render(`digraph {
      node [style=filled];
      A [class="Queued", fillcolor="#DC2626"];
      B [shape=plaintext, class="plain", fillcolor="#347D39"];
    }`);
    expect(classesOf(svg, 'A')).toEqual(['node', 'Queued']);
    expect(classesOf(svg, 'B')).toEqual(['node', 'plain']);
  });

  it('strips the alpha Graphviz emits alongside a colour', async () => {
    const svg = await render(`digraph {
      node [style=filled];
      A [fillcolor="#347d3980"];
    }`);
    expect(svg).not.toMatch(/opacity="/);
  });

  it('leaves a fence it cannot render as a code block', async () => {
    const node: mdast.Code = { type: 'code', lang: 'dot', meta: null, value: 'digraph { --- }' };
    const tree: mdast.Root = { type: 'root', children: [node] };
    await attach()(tree);
    expect(node.type).toBe('code');
  });
});
