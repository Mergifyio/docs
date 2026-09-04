import { describe, expect, it } from 'vitest';
import { iterFiles, scanFile, scanText } from './check-diagram-tokens.mjs';

const fence = (body) => ['```dot class="queue"', body, '```'].join('\n');
const rulesOf = (text, opts) => scanText(text, opts).map((f) => f.rule);

describe('scanText', () => {
  it('catches a colour written inside a diagram', () => {
    expect(rulesOf(fence('A [fillcolor="#347D39"];'))).toEqual([
      'graphviz-color-attr',
      'diagram-hex',
    ]);
    expect(rulesOf(fence('edge [color="#374151"];'))).toEqual([
      'graphviz-color-attr',
      'diagram-hex',
    ]);
    expect(rulesOf(fence('graph [bgcolor="#FAFBFC"];'))).toEqual([
      'graphviz-color-attr',
      'diagram-hex',
    ]);
    // A named colour carries no hex, and is just as unreachable by the tokens.
    expect(rulesOf(fence('A [fontcolor=white];'))).toEqual(['graphviz-color-attr']);
  });

  it('reports a compound attribute once, as itself', () => {
    const found = scanText(fence('A [fillcolor="#347D39"];'));
    expect(found.map((f) => f.match)).toEqual(['fillcolor=', '#347D39']);
  });

  it('leaves a diagram that names roles alone', () => {
    expect(
      rulesOf(
        fence(`digraph {
  subgraph cluster_b { class="batch"; label="Batch 1"; PR1 [class="queued"]; }
  CI [label="Continuous\\nintegration", class="external"];
  PR1 -> CI [class="muted", style=dashed];
}`)
      )
    ).toEqual([]);
  });

  it('treats none and transparent as shape, not colour', () => {
    // These say "draw nothing", which is the one thing a role cannot express.
    expect(rulesOf(fence('graph [bgcolor="transparent"];'))).toEqual([]);
    expect(rulesOf(fence('A [color=none];'))).toEqual([]);
    expect(rulesOf(fence('A [color="none", fillcolor="#347D39"];'))).toEqual([
      'graphviz-color-attr',
      'diagram-hex',
    ]);
  });

  it('does not fire on the pull request numbers diagrams are full of', () => {
    expect(rulesOf(fence('PR1 [label="PR #101\\nScopes: frontend"];'))).toEqual([]);
  });

  it('ignores colours outside a diagram', () => {
    // A docs page is mostly prose and code samples, where a colour is content.
    const page = [
      'Set the badge colour with `color="#347D39"` in your config.',
      '',
      '```css',
      '.badge { color: #347d39; }',
      '```',
      '',
      fence('A [class="queued"];'),
    ].join('\n');
    expect(rulesOf(page)).toEqual([]);
  });

  it('scans a hand-drawn diagram component end to end', () => {
    // GitGraph and StackMapping draw SVG directly, so they have no fence for the
    // fence scan to find — and they are where two of the four dialects lived.
    const component = 'const COLORS = { green: "#347D39" };';
    expect(rulesOf(component)).toEqual([]);
    expect(rulesOf(component, { wholeFile: true })).toEqual(['diagram-hex']);
  });

  it('honours an allow directive on the line above', () => {
    expect(
      rulesOf(
        fence(`// diagram-tokens: allow diagram-hex — this diagram is about the colour
A [label="#347D39"];`)
      )
    ).toEqual([]);
  });
});

describe('the docs themselves', () => {
  it('has no diagram that names a colour', () => {
    const findings = [...iterFiles(['src/content/docs', 'src/components'])].flatMap(scanFile);
    expect(findings).toEqual([]);
  });
});
