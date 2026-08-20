#!/usr/bin/env node
/**
 * Scan the docs for internal information that must never be published: support
 * ticket and thread IDs, tracker ticket references, private repository and
 * source paths, and internal tracker links.
 *
 * Docs are frequently written *from* internal material — a support case, a
 * private PR, an engine source file — and that material travels with the draft.
 * This catches the mechanical half of the problem so a leak fails CI instead of
 * shipping to docs.mergify.com.
 *
 * It only knows fixed patterns. Customer and org names, copied examples, and
 * "as discussed with the customer" framing cannot be regexed; those are the
 * `proofread-leaks` skill's job. A clean run here is not a clean bill of health.
 *
 * Usage:
 *   node scripts/check-internal-leaks.mjs [paths...]   # scan (default: src/content/docs)
 *   node scripts/check-internal-leaks.mjs --json [paths...]
 *
 * False positives are expected to be rare enough to handle one at a time. To
 * allow a specific line, put a comment on the line before it naming the rule:
 *
 *   {/* internal-leaks: allow internal-source-path — documenting the OSS engine layout *\/}
 *
 * In YAML or shell fences, use `# internal-leaks: allow <rule-id> — why`. When one
 * line trips more than one rule, name them separated by commas.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');
const DEFAULT_TARGETS = ['src/content/docs'];
const SCANNED_EXTENSIONS = ['.mdx', '.md'];

/**
 * Each rule is deliberately narrow: it must not fire on anything already in the
 * docs, or on the placeholders docs legitimately use (`my-org`, `your-repo`).
 * Public Mergify repos, `dashboard.mergify.com`, and third-party dashboards the
 * reader is meant to visit are all fine and must not match.
 */
export const RULES = [
  {
    id: 'support-ticket',
    label: 'support ticket or thread ID',
    re: /\bT-\d{3,6}\b|\bth_[0-9A-Za-z]{16,}\b|\bapp\.plain\.com\b/g,
  },
  {
    id: 'ticket-ref',
    label: 'internal tracker ticket reference',
    // A bare issue key is the shape a ticket takes everywhere except a URL: in
    // prose, inside a `--reason` string, in a branch name. `internal-tracker`
    // below only sees the link form, so a bare key used to pass — one shipped to
    // the public site in a CLI example. Prefixes are listed explicitly rather
    // than matched as a generic `[A-Z]{3,}-\d+`: that shape reads as a plausible
    // example value (`AES-256`, `WCAG-2`, a reader's own issue keys in a sample
    // config), and every one of those false positives would land on a docs
    // contributor. `mrgfy-` matches too, because that is the form the key takes
    // in a branch name. `HD-` stays case-sensitive: lowercase `-hd-2` is a
    // believable file or slug fragment, uppercase `HD-2` is not.
    re: /\b(?:MRGFY|mrgfy)-\d+\b|\bHD-\d+\b/g,
  },
  {
    id: 'internal-source-path',
    label: 'private repository or internal source path',
    re: /\bmergify_shadow_office\b|\bshadow[-_ ]office\b|\bMergifyio\/monorepo\b|\bmergify_engine\b/gi,
  },
  {
    id: 'internal-tracker',
    label: 'internal tracker or wiki link',
    re: /\blinear\.app\/|\.notion\.so\/|\bnotion\.site\//gi,
  },
  {
    id: 'internal-host',
    label: 'internal Mergify hostname',
    re: /\b(?:admin|internal|staging|shadow(?:-office)?)\.mergify\.(?:com|io)\b/gi,
  },
];

// A single line can trip several rules at once — a tracker URL carries the
// ticket key inside it — so the directive takes a comma-separated list, not one
// rule. Commas rather than spaces: the reason that follows the ids is prose, and
// space-separated ids would swallow its first words as rule names.
const ALLOW_RE = /internal-leaks:\s*allow\s+([\w-]+(?:\s*,\s*[\w-]+)*)/i;

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

/** Scan text; returns [{line, rule, label, match}, ...]. */
export function scanText(text, rules = RULES) {
  const lines = text.split('\n');
  const findings = [];
  lines.forEach((line, i) => {
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

export function scanFile(file, rules = RULES) {
  return scanText(fs.readFileSync(file, 'utf8'), rules).map((f) => ({
    ...f,
    file: path.relative(ROOT, file),
  }));
}

export function* iterFiles(targets) {
  for (const t of targets) {
    const abs = path.resolve(ROOT, t);
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(abs, { withFileTypes: true, recursive: true })) {
        if (entry.isFile() && SCANNED_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
          yield path.join(entry.parentPath ?? entry.path, entry.name);
        }
      }
    } else if (SCANNED_EXTENSIONS.some((ext) => abs.endsWith(ext))) {
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

  console.log(`Scanned ${scanned} file(s) for internal information.`);
  if (findings.length === 0) {
    console.log('No internal identifiers found.');
    return 0;
  }
  console.error(`\n${findings.length} possible leak(s):\n`);
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line} — ${f.label} — ${f.match}`);
  }
  console.error(
    '\nRewrite the line so it states the product behavior without the internal\n' +
      'identifier (see .claude/skills/proofread-leaks). If a match is genuinely\n' +
      'public, allow it on the line above:\n' +
      '  {/* internal-leaks: allow <rule-id>[, <rule-id>...] — why */}'
  );
  return 1;
}

// Run as a CLI only when invoked directly, so tests can import the helpers.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
