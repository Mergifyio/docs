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

  it('passes the role a fence names straight through to the SVG', async () => {
    // The whole system rests on this: Graphviz copies `class` verbatim, so the
    // plugin never has to resolve a colour and CSS can do it at paint time.
    const svg = await render(`digraph {
      A [class="failed"];
      subgraph cluster_b { class="batch"; label="Batch"; A; }
      A -> B [class="muted"];
    }`);
    expect(classesOf(svg, 'A')).toEqual(['node', 'failed']);
    expect(classesOf(svg, 'cluster_b')).toEqual(['cluster', 'batch']);
    expect(classesOf(svg, 'A->B')).toEqual(['edge', 'muted']);
  });

  it('never invents a role for an element that names none', async () => {
    const svg = await render('digraph { A; A -> B; }');
    expect(classesOf(svg, 'A')).toEqual(['node']);
    expect(classesOf(svg, 'A->B')).toEqual(['edge']);
  });

  it('applies the layout defaults of the kind a fence opts into', async () => {
    const flow = await render('digraph { A -> B; }', 'class="flow"');
    const queue = await render('digraph { A -> B; }', 'class="queue"');
    // `flow` is top-to-bottom and `queue` is left-to-right, so the same two
    // nodes come out stacked in one and side by side in the other.
    const box = (svg: string) => /viewBox="[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)"/.exec(svg)!;
    expect(Number(box(flow)[1])).toBeLessThan(Number(box(flow)[2]));
    expect(Number(box(queue)[1])).toBeGreaterThan(Number(box(queue)[2]));
  });

  it('does not reach Object.prototype for a kind a fence made up', async () => {
    // The class comes from the fence, so an unguarded lookup would splice
    // `function Object() { [native code] }` into the DOT and fail the render.
    const svg = await render('digraph { A -> B; }', 'class="constructor"');
    expect(svg).toMatch(/^<svg/);
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
