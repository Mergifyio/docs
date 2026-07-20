#!/usr/bin/env node
/**
 * Validate the Mergify configuration examples embedded in the docs against the
 * real Mergify config JSON Schema, so a broken example fails CI instead of
 * silently misleading users.
 *
 * It scans MDX files for ```yaml / ```yml code fences, classifies each block,
 * and validates the ones that are complete Mergify configs against
 * `public/mergify-configuration-schema.json` (the same schema the docs site
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
import yaml from 'js-yaml';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');
const SCHEMA_PATH = path.join(ROOT, 'public', 'mergify-configuration-schema.json');

// Top-level keys that mark a complete Mergify configuration file.
const MERGIFY_TOP_KEYS = new Set([
  'queue_rules',
  'pull_request_rules',
  'merge_protections',
  'merge_protections_settings',
  'commands_restrictions',
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

const FENCE_RE = /^([ \t]*)(`{3,}|~{3,})([^\n`]*)$/;
const PARTIAL_MARKER_RE = /^\s*#\s*partial\b/i;
const TOP_KEY_RE = /^([A-Za-z_][\w-]*):/;
// MDX comment directive placed on the line before a fence to skip validation.
const SKIP_DIRECTIVE_RE = /\{\/\*\s*validate-config-examples:\s*skip\b/i;

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

/** Validate the `mergify-config` blocks; returns [{file, line, msg}, ...]. */
export function validateBlocks(blocks, validate = createValidator()) {
  const failures = [];
  for (const b of blocks) {
    if (b.classification !== 'mergify-config') continue;
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

  const failures = validateBlocks(blocks);
  const configs = blocks.filter((b) => b.classification === 'mergify-config');
  const skipped = blocks.filter((b) => b.classification === 'skipped').length;
  console.log(
    `Checked ${configs.length} Mergify config example(s) ` +
      `(${blocks.length} YAML blocks scanned, ${skipped} explicitly skipped).`
  );
  if (failures.length === 0) {
    console.log('All config examples are valid.');
    return 0;
  }
  console.error(`\n${failures.length} invalid config example(s):\n`);
  for (const f of failures) console.error(`  ${f.file}:${f.line} — ${f.msg}`);
  console.error(
    '\nFix the snippet, or if it is an intentional fragment add a `# partial` ' +
      'comment / `...` placeholder, or mark a deliberately-invalid block with an ' +
      'MDX comment: {/* validate-config-examples: skip — why */}'
  );
  return 1;
}

// Run as a CLI only when invoked directly, so tests can import the helpers.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
