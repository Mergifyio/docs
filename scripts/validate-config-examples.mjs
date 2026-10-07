#!/usr/bin/env node
/**
 * Validate the Mergify configuration examples embedded in the docs against the
 * real Mergify config JSON Schema, so a broken example fails CI instead of
 * silently misleading users.
 *
 * It scans MDX files for ```yaml / ```yml code fences, classifies each block,
 * and validates the ones that are complete Mergify configs — plus the standalone
 * merge protection rules, which are wrapped back into a `merge_protections` list
 * first — against `public/mergify-configuration-schema.json` (the same schema the docs site
 * serves and that `mergify config validate` fetches — but read from disk so a
 * PR is checked against its own schema, offline, with no network round-trip).
 *
 * Validation is STRUCTURAL only: it checks keys, types and shapes, not the
 * semantics of condition expressions or Mergify's custom string formats
 * (`duration`, `template`, ...). Those custom formats are intentionally NOT
 * enforced — a generic JSON-Schema format validator reads `format: duration`
 * as ISO-8601 and would reject valid Mergify durations like "5 min". For deep
 * semantic checks, `mergify config validate` remains the authoritative tool.
 *
 * Usage:
 *   node scripts/validate-config-examples.mjs [paths...]   # validate (default: src/content/docs)
 *   node scripts/validate-config-examples.mjs --json [paths...]  # dump classification as JSON
 *
 * A block that is none of those is unrecognized and not validatable — except
 * when its top-level key is one edit away from a Mergify one, which means a
 * complete config misspelling the key that identifies it. That fails, because
 * the alternative is a snippet Mergify rejects shipping green.
 *
 * A block is skipped when it is a partial fragment, a `...` placeholder, a
 * GitHub Actions workflow, or explicitly marked. To mark a complete-looking
 * config that should NOT be validated (e.g. deprecated syntax shown in a
 * migration guide), put an MDX comment on the line before the fence:
 *
 *   {/* validate-config-examples: skip — why *\/}
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import * as yaml from 'js-yaml';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');
const SCHEMA_PATH = path.join(ROOT, 'public', 'mergify-configuration-schema.json');

// Top-level keys that mark a complete Mergify configuration file. Every
// top-level property the configuration schema defines, plus `partition_rules`,
// which the schema has dropped but the migration guide still shows.
const MERGIFY_TOP_KEYS = new Set([
  'queue_rules',
  'pull_request_rules',
  'merge_protections',
  'merge_protections_settings',
  'commands_restrictions',
  'conflict_resolvers',
  'merge_queue',
  'shared',
  'defaults',
  'extends',
  'scopes',
  'partition_rules',
  'priority_rules',
]);

// Signals that a YAML block is a GitHub Actions / CI workflow, not Mergify config.
const CI_SIGNALS = ['runs-on:', 'uses:', 'jobs:', 'steps:'];

// A merge protection rule is often shown on its own, as one item of the
// `merge_protections` list with the list marker stripped. `if` is the only rule
// key in the whole schema that no other rule kind has, so `name` + `if`
// identifies one unambiguously — and wrapping it back into a list makes it
// validatable like any other config. Deliberately not keyed on
// `success_conditions`: a rule that misspells it is exactly what this should
// catch, and the schema requires it.
const MERGE_PROTECTION_RULE_KEYS = ['name', 'if'];

const FENCE_RE = /^([ \t]*)(`{3,}|~{3,})([^\n`]*)$/;
const PARTIAL_MARKER_RE = /^\s*#\s*partial\b/i;
const TOP_KEY_RE = /^([A-Za-z_][\w-]*):/;
// MDX comment directive placed on the line before a fence to skip validation.
const SKIP_DIRECTIVE_RE = /\{\/\*\s*validate-config-examples:\s*skip\b/i;

/**
 * True when `a` and `b` are within one single-character edit of each other.
 * Used only to compare a top-level key against `MERGIFY_TOP_KEYS`, so the
 * inputs are short and a simple scan beats a full distance matrix.
 */
export function withinOneEdit(a, b) {
  if (a === b) return false;
  if (Math.abs(a.length - b.length) > 1) return false;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  let i = 0;
  let j = 0;
  let edited = false;
  while (i < short.length && j < long.length) {
    if (short[i] === long[j]) {
      i += 1;
      j += 1;
      continue;
    }
    if (edited) return false;
    edited = true;
    // Same length means a substitution; otherwise skip one char of the longer.
    if (short.length === long.length) i += 1;
    j += 1;
  }
  return true;
}

/**
 * Top-level keys of an otherwise-unrecognized block that are one edit away from
 * a key that would have made it a complete Mergify config.
 *
 * `classify` has no bucket for "meant to be a Mergify config but misspells the
 * key that says so": a singular `pull_request_rule:` matches no top key, is not
 * all-indented, and so lands in `unknown` — which is neither validated nor
 * reported. The snippet is then a config Mergify rejects, shipped green. This
 * narrows that silence to the cases worth failing on.
 */
export function nearMissTopKeys(code) {
  const hits = new Set();
  for (const ln of code.split('\n')) {
    const m = ln.match(TOP_KEY_RE);
    if (!m) continue;
    for (const known of MERGIFY_TOP_KEYS) {
      if (withinOneEdit(m[1], known)) hits.add(`${m[1]} (did you mean ${known}?)`);
    }
  }
  return [...hits];
}

export function langOf(info) {
  const token = info.trim().split(/\s+/)[0] || '';
  return token.replace(/^\{/, '').replace(/\}$/, '').toLowerCase();
}

export function classify(code) {
  const lines = code.split('\n');
  const meaningful = lines.filter((ln) => ln.trim() && !ln.trimStart().startsWith('#'));

  // Explicit author marker wins.
  if (lines.slice(0, 3).some((ln) => PARTIAL_MARKER_RE.test(ln))) return 'partial';

  // A bare `...` placeholder line means the example is deliberately incomplete.
  if (meaningful.some((ln) => ln.trim() === '...')) return 'partial';

  const text = lines.join('\n');
  if (CI_SIGNALS.some((sig) => text.includes(sig)) && text.includes('on:')) {
    return 'github-actions';
  }

  const topKeys = new Set();
  for (const ln of lines) {
    const m = ln.match(TOP_KEY_RE);
    if (m) topKeys.add(m[1]);
  }
  for (const k of topKeys) if (MERGIFY_TOP_KEYS.has(k)) return 'mergify-config';

  if (MERGE_PROTECTION_RULE_KEYS.every((k) => topKeys.has(k))) {
    return 'merge-protection-rule';
  }

  // No unindented top-level key at all -> a fragment (e.g. a single rule shown
  // inline). Not independently validatable.
  if (meaningful.length && meaningful.every((ln) => /^[ \t-]/.test(ln))) return 'partial';

  return 'unknown';
}

export function extractFromFile(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const out = [];
  let i = 0;
  const n = lines.length;
  while (i < n) {
    const m = lines[i].match(FENCE_RE);
    if (!m) {
      i += 1;
      continue;
    }
    const [, indent, fence, info] = m;
    const lang = langOf(info);
    const fenceLine = i + 1; // 1-based

    // Nearest non-blank line above the fence, to detect a skip directive.
    let p = i - 1;
    while (p >= 0 && !lines[p].trim()) p -= 1;
    const skip = p >= 0 && SKIP_DIRECTIVE_RE.test(lines[p]);

    const body = [];
    let j = i + 1;
    let closed = false;
    while (j < n) {
      const cm = lines[j].match(FENCE_RE);
      if (cm && cm[2][0] === fence[0] && cm[2].length >= fence.length && !cm[3].trim()) {
        closed = true;
        break;
      }
      body.push(lines[j]);
      j += 1;
    }
    if (lang === 'yaml' || lang === 'yml') {
      const code = body
        .map((ln) => (ln.startsWith(indent) ? ln.slice(indent.length) : ln))
        .join('\n');
      out.push({
        file: path.relative(ROOT, file),
        line: fenceLine,
        lang,
        classification: skip ? 'skipped' : classify(code),
        code,
      });
    }
    i = closed ? j + 1 : j;
  }
  return out;
}

export function* iterMdx(targets) {
  for (const t of targets) {
    const abs = path.resolve(ROOT, t);
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(abs, { withFileTypes: true, recursive: true })) {
        if (entry.isFile() && entry.name.endsWith('.mdx')) {
          yield path.join(entry.parentPath ?? entry.path, entry.name);
        }
      }
    } else if (abs.endsWith('.mdx')) {
      yield abs;
    }
  }
}

// Mergify hands the value of a `~=` (regex) or `*=` (glob) condition to the
// pattern engine verbatim — unlike `=`, it does not strip surrounding quotes.
// YAML in turn only strips quotes that *open* a scalar, so `- files ~= "^ui/"`
// reaches Mergify with its quotes attached and compiles a pattern expecting a
// literal `"` before a start-of-string anchor: it can never match, and the rule
// silently does nothing. Neither language complains, and the schema sees a
// well-formed string, so this is invisible to the validation above.
// The fix is to quote the whole condition (`"files ~= ^ui/"`) or nothing at all.
const QUOTED_PATTERN_RE = /(?:~=|\*=)\s*(["'])(?:(?!\1).)*\1\s*$/;
const LIST_ITEM_RE = /^\s*-\s+(\S.*)$/;

/** Find conditions whose pattern is quoted inside an unquoted YAML scalar. */
export function findQuotedPatterns(blocks) {
  const failures = [];
  for (const b of blocks) {
    b.code.split('\n').forEach((ln, idx) => {
      const item = ln.match(LIST_ITEM_RE);
      if (!item) return;
      const scalar = item[1];
      // A scalar the author quoted is YAML's to unquote, so the pattern is clean.
      if (scalar.startsWith('"') || scalar.startsWith("'")) return;
      if (!QUOTED_PATTERN_RE.test(scalar)) return;
      failures.push({
        file: b.file,
        line: b.line + 1 + idx,
        msg:
          `quoted pattern in \`${scalar.trim()}\` — the quotes are part of the ` +
          'pattern and it will never match; quote the whole condition or nothing',
      });
    });
  }
  return failures;
}

/** Compile the Mergify config schema into a structural-only validator. */
export function createValidator(schemaPath = SCHEMA_PATH) {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  // Structural validation only: `validateFormats: false` ignores every `format`
  // keyword (Mergify's custom `duration`/`template`/... and standard ones alike)
  // without warning, so we never reject a valid Mergify value a generic format
  // checker would misread (e.g. `checks_timeout: 5 min` vs ISO-8601 `duration`).
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
  return ajv.compile(schema);
}

/** The classifications that get validated against the schema. */
export const VALIDATED_CLASSIFICATIONS = ['mergify-config', 'merge-protection-rule'];

/** Validate the schema-checkable blocks; returns [{file, line, msg}, ...]. */
export function validateBlocks(blocks, validate = createValidator()) {
  const failures = [];
  for (const b of blocks) {
    // An `unknown` block is not validatable, but one whose top-level key merely
    // misspells a Mergify key is a config that would be rejected, and silence
    // there is the one outcome this script exists to prevent.
    if (b.classification === 'unknown') {
      const near = nearMissTopKeys(b.code);
      if (near.length) {
        const msg = `misspelled top-level key: ${near.join(', ')}`;
        failures.push({ file: b.file, line: b.line, msg });
      }
      continue;
    }
    if (!VALIDATED_CLASSIFICATIONS.includes(b.classification)) continue;
    let doc;
    try {
      doc = yaml.load(b.code);
    } catch (e) {
      failures.push({
        file: b.file,
        line: b.line,
        msg: `invalid YAML: ${e.message.split('\n')[0]}`,
      });
      continue;
    }
    if (b.classification === 'merge-protection-rule') doc = { merge_protections: [doc] };
    if (validate(doc)) continue;
    const detail = (validate.errors || [])
      .slice(0, 3)
      .map((e) => `${e.instancePath || '/'} ${e.message}`)
      .join('; ');
    failures.push({ file: b.file, line: b.line, msg: detail });
  }
  return failures;
}

function main(argv) {
  const jsonMode = argv.includes('--json');
  const targets = argv.filter((a) => a !== '--json');
  if (targets.length === 0) targets.push('src/content/docs');

  const blocks = [];
  for (const file of iterMdx(targets)) blocks.push(...extractFromFile(file));

  if (jsonMode) {
    process.stdout.write(`${JSON.stringify(blocks, null, 2)}\n`);
    return 0;
  }

  // Quoted patterns are checked in every YAML block, not just the complete
  // configs: most conditions in the docs live in fragments showing a single rule.
  const failures = [...validateBlocks(blocks), ...findQuotedPatterns(blocks)];
  const configs = blocks.filter((b) => VALIDATED_CLASSIFICATIONS.includes(b.classification));
  const skipped = blocks.filter((b) => b.classification === 'skipped').length;
  console.log(
    `Checked ${configs.length} Mergify config example(s) ` +
      `(${blocks.length} YAML blocks scanned, ${skipped} explicitly skipped).`
  );
  if (failures.length === 0) {
    console.log('All config examples are valid.');
    return 0;
  }
  console.error(`\n${failures.length} problem(s) in config examples:\n`);
  for (const f of failures) console.error(`  ${f.file}:${f.line} — ${f.msg}`);
  console.error(
    '\nFix the snippet. A quoted pattern is fixed by moving the quotes to the ' +
      'whole condition, or dropping them. For a schema error on an intentional ' +
      'fragment, add a `# partial` comment / `...` placeholder, or mark a ' +
      'deliberately-invalid block with an MDX comment: ' +
      '{/* validate-config-examples: skip — why */}'
  );
  return 1;
}

// Run as a CLI only when invoked directly, so tests can import the helpers.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
