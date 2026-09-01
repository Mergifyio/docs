#!/usr/bin/env node
/**
 * Scan the docs for diagrams that name a color.
 *
 * A diagram names a *role* — `queued`, `merged`, `failed`, `external` — and the
 * page resolves it from the design tokens at paint time, so the diagram themes
 * itself and every page uses one palette. That worked until it didn't: before
 * this rule existed, 63 distinct colors had accumulated across 18 pages in four
 * unrelated dialects, none of which the token system could reach and none of
 * which adapted to dark mode.
 *
 * Nothing about a hardcoded color fails a build on its own — the diagram
 * renders, it just renders wrong on half the site — so this is the thing that
 * keeps it from happening again. See DESIGN.md "Diagrams" for the roles.
 *
 * Usage:
 *   node scripts/check-diagram-tokens.mjs [paths...]
 *     # with no paths: the docs pages, the components, and the shared
 *     # post-processor — see DEFAULT_TARGETS below.
 *   node scripts/check-diagram-tokens.mjs --json [paths...]
 *
 * To allow a specific line, put a comment on the line before it naming the rule:
 *
 *   // diagram-tokens: allow graphviz-color-attr — a legend of the palette itself
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');
const DEFAULT_TARGETS = ['src/content/docs', 'src/components', 'src/util/diagramSvg.ts'];

/**
 * Page extensions, scanned fence by fence. The diagram components below are
 * not pages and are matched by name instead, whatever their extension — which
 * is why `.astro` is absent here and `src/util/diagramSvg.ts` is named as a
 * target of its own: it lives outside every directory scanned above.
 */
const SCANNED_EXTENSIONS = ['.mdx', '.md'];

/**
 * Each rule is deliberately narrow, because a false positive lands on a docs
 * contributor. `#RRGGBB` is required in full: a three-digit match would fire on
 * every `PR #101` in a diagram label, which is how the diagrams talk.
 */
export const RULES = [
  {
    id: 'graphviz-color-attr',
    label: 'Graphviz color attribute',
    // `(?<![\w-])` so `fillcolor` is reported once, as itself, rather than also
    // matching the bare `color` inside it. `none` and `transparent` are not
    // colors — they are the absence of one, which is shape work, not styling,
    // and the way a diagram says "draw no canvas" or "draw no border".
    re: /(?<![\w-])(?:bg|fill|font|pen|label)?color\s*=\s*(?!"?(?:none|transparent)\b)/gi,
  },
  {
    id: 'diagram-hex',
    label: 'hardcoded color',
    re: /#[0-9a-f]{6}\b/gi,
  },
];

/** A `dot` / `circo` / `neato` fence, and the fence-attribute line above it. */
const FENCE_RE = /^([ \t]*)```(?:dot|circo|neato)([^\n]*)\n([\s\S]*?)^[ \t]*```/gm;

/**
 * The hand-drawn diagram components. They are not fences, so the fence scan
 * cannot see them — and they are exactly where the second and third private
 * palettes lived before they were folded into the shared one.
 */
const DIAGRAM_COMPONENTS = ['GitGraph.astro', 'StackMapping.astro', 'diagramSvg.ts'];

const ALLOW_RE = /diagram-tokens:\s*allow\s+([\w-]+(?:\s*,\s*[\w-]+)*)/i;

/** Rule IDs allowed by a directive on the line above `index` (0-based). */
function allowedOnLine(lines, index) {
  const allowed = new Set();
  for (let p = index - 1; p >= 0; p -= 1) {
    if (!lines[p].trim()) continue;
    const m = lines[p].match(ALLOW_RE);
    if (m) for (const id of m[1].split(',')) allowed.add(id.trim().toLowerCase());
    break;
  }
  return allowed;
}

/**
 * The 1-based line numbers that belong to a diagram: everything inside a
 * Graphviz fence, plus its attribute line. Everything else in a docs page is
 * prose and code samples, where a color is ordinary content — a CSS example,
 * a screenshot description, a config value.
 */
function diagramLines(text) {
  const lines = new Set();
  for (const m of text.matchAll(FENCE_RE)) {
    const start = text.slice(0, m.index).split('\n').length;
    const length = `${m[2]}\n${m[3]}`.split('\n').length;
    for (let i = 0; i < length; i += 1) lines.add(start + i);
  }
  return lines;
}

/** Scan text; returns [{line, rule, label, match}, ...]. */
export function scanText(text, { wholeFile = false, rules = RULES } = {}) {
  const lines = text.split('\n');
  const inDiagram = wholeFile ? null : diagramLines(text);
  const findings = [];

  lines.forEach((line, i) => {
    if (inDiagram && !inDiagram.has(i + 1)) return;
    let allowed = null;
    for (const rule of rules) {
      rule.re.lastIndex = 0;
      const matches = line.match(rule.re);
      if (!matches) continue;
      allowed ??= allowedOnLine(lines, i);
      if (allowed.has(rule.id)) continue;
      for (const match of new Set(matches)) {
        findings.push({ line: i + 1, rule: rule.id, label: rule.label, match });
      }
    }
  });

  return findings;
}

export function scanFile(file) {
  const wholeFile = DIAGRAM_COMPONENTS.includes(path.basename(file));
  return scanText(fs.readFileSync(file, 'utf8'), { wholeFile }).map((f) => ({
    ...f,
    file: path.relative(ROOT, file),
  }));
}

export function* iterFiles(targets) {
  for (const t of targets) {
    const abs = path.resolve(ROOT, t);
    if (!fs.existsSync(abs)) continue;
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(abs, { withFileTypes: true, recursive: true })) {
        if (!entry.isFile()) continue;
        const name = entry.name;
        const isComponent = DIAGRAM_COMPONENTS.includes(name);
        const isPage = SCANNED_EXTENSIONS.some((ext) => name.endsWith(ext));
        if (isComponent || isPage) yield path.join(entry.parentPath ?? entry.path, name);
      }
    } else {
      yield abs;
    }
  }
}

function main(argv) {
  const jsonMode = argv.includes('--json');
  const targets = argv.filter((a) => a !== '--json');
  if (targets.length === 0) targets.push(...DEFAULT_TARGETS);

  const findings = [];
  let scanned = 0;
  for (const file of iterFiles(targets)) {
    scanned += 1;
    findings.push(...scanFile(file));
  }

  if (jsonMode) {
    process.stdout.write(`${JSON.stringify(findings, null, 2)}\n`);
    return findings.length === 0 ? 0 : 1;
  }

  console.log(`Scanned ${scanned} file(s) for diagrams that name a color.`);
  if (findings.length === 0) {
    console.log('Every diagram resolves its colors from tokens.');
    return 0;
  }
  console.error(`\n${findings.length} diagram color(s) written by hand:\n`);
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line} — ${f.label} — ${f.match}`);
  }
  console.error(
    '\nName a role instead, and let the page resolve the color:\n' +
      '  PR1 [class="queued"];   not   PR1 [fillcolor="#347D39"];\n' +
      'The roles are queued, pending, merged, failed, config, mergify,\n' +
      'datastore, external, batch, muted and chrome; `plain` marks a caption\n' +
      'rather than a box. See DESIGN.md "Diagrams". If a color is genuinely\n' +
      'the subject rather than the styling, allow it on the line above:\n' +
      '  // diagram-tokens: allow <rule-id>[, <rule-id>...] — why'
  );
  return 1;
}

// Run as a CLI only when invoked directly, so tests can import the helpers.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
