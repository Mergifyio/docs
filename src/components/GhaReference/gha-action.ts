import { createHash } from 'node:crypto';
import fs from 'node:fs';
import * as yaml from 'js-yaml';
import { helpToHtml } from '~/components/CliReference/cli-schema';
import ghaMergifyCiVersion from '~/data/gha-mergify-ci-version.json';

/**
 * The model behind `/integrations/gha/reference`, derived at build time from
 * `src/data/gha-mergify-ci-action.yml`.
 *
 * That file is the action's `action.yml`, byte for byte, under a one-line
 * stamp naming the release tag it was taken at and its git blob. It is vendored
 * verbatim rather than reduced to a docs-shaped JSON on purpose. A reduced
 * snapshot needs a generator, which would live in the sync job and not here, so
 * the rules for "which action reads which input" would be a second
 * implementation in another repository, tested by nobody. Verbatim, vendoring is
 * a download and every derivation below is covered by this repository's tests.
 *
 * The version sync bumps `gha-mergify-ci-version.json` on its own, and nothing
 * else refreshes this file. So the stamp is checked on every load: a pinned
 * version this file was not taken at fails the build, instead of publishing the
 * old release's inputs under the new release's number.
 */

export const GHA_ACTION_PATH = 'src/data/gha-mergify-ci-action.yml';
export const GHA_ACTION_REPOSITORY = 'Mergifyio/gha-mergify-ci';

/** The subset of the `action.yml` metadata syntax this page reads. */
interface ActionYaml {
  name: string;
  description?: string;
  inputs?: Record<
    string,
    { description?: string; default?: string | number | boolean; required?: boolean } | null
  >;
  outputs?: Record<string, { description?: string; value?: string } | null>;
  runs?: { steps?: Array<Record<string, unknown>> };
}

export interface GhaInput {
  name: string;
  description: string | null;
  default: string | null;
  required: boolean;
  /** The `action:` values whose steps read this input, in `actions` order. */
  actions: string[];
  /**
   * The `action:` values that fail or misbehave without this input, in
   * `actions` order. `required: true` makes that every reader; otherwise the
   * description names them on its own `Required by:` line, which is stripped
   * from the rendered description.
   */
  requiredBy: string[];
}

export interface GhaOutput {
  name: string;
  description: string | null;
  /** The `action:` values whose steps set this output, in `actions` order. */
  actions: string[];
}

export interface GhaSubAction {
  name: string;
  /** The summary the `action` input's own description gives this value. */
  summary: string | null;
}

export interface GhaActionReference {
  name: string;
  description: string | null;
  /** The release tag the snapshot was taken at, e.g. `v25`. */
  version: string;
  actions: GhaSubAction[];
  inputs: GhaInput[];
  outputs: GhaOutput[];
}

// ---------------------------------------------------------------------------
// Derivation
// ---------------------------------------------------------------------------

const ACTION_LITERAL = /inputs\.action\s*==\s*'([^']+)'/g;
const INPUT_REFERENCE = /\binputs\.([A-Za-z0-9_-]+)/g;
const STEP_OUTPUT_REFERENCE = /\bsteps\.([A-Za-z0-9_-]+)\.outputs\b/g;

function matchAll(pattern: RegExp, text: string): string[] {
  return [...text.matchAll(pattern)].map((match) => match[1]);
}

/**
 * The `action:` values a step runs for, read off the `inputs.action == '…'`
 * literals in its `if:`. A step with none runs whatever `action` is — which is
 * also what the input check does, since it only ever tests `!=` — so it answers
 * null, meaning every action.
 */
function stepActions(step: Record<string, unknown>): string[] | null {
  const condition = typeof step.if === 'string' ? step.if : '';
  const literals = matchAll(ACTION_LITERAL, condition);
  return literals.length > 0 ? literals : null;
}

/** Keep `wanted` in the order of `order`, dropping duplicates. */
function inOrder(order: string[], wanted: Set<string>): string[] {
  return order.filter((name) => wanted.has(name));
}

/**
 * Per-action summaries from the `action` input's description, which lists each
 * value as `* name: summary`. Only lines naming a value some step runs for
 * count, so a reworded bullet costs a summary, never a phantom action.
 */
function actionSummaries(description: string | undefined, names: string[]): Map<string, string> {
  const summaries = new Map<string, string>();
  for (const line of (description ?? '').split('\n')) {
    const match = line.match(/^\s*[*-]\s+([A-Za-z0-9_-]+):\s*(.+)$/);
    if (match && names.includes(match[1])) summaries.set(match[1], match[2].trim());
  }
  return summaries;
}

const REQUIRED_BY = /^\s*Required by:\s*(.+?)\s*$/i;

/**
 * Split an input description into its prose and the actions its trailing
 * `Required by: a, b` line names. `action.yml` has one `required` flag per
 * input, which cannot say "required for `junit-process`, optional for
 * `scopes`", so a multiplexed action states it in the description instead;
 * that line is the contract and this only reads it.
 */
export function requiredByLine(description: string | undefined): {
  description: string | undefined;
  requiredBy: string[];
} {
  if (description === undefined) return { description, requiredBy: [] };
  const requiredBy: string[] = [];
  const kept: string[] = [];
  for (const line of description.split('\n')) {
    const match = line.match(REQUIRED_BY);
    if (match) requiredBy.push(...match[1].split(/[\s,]+/).filter(Boolean));
    else kept.push(line);
  }
  return { description: kept.join('\n'), requiredBy };
}

function stringOrNull(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

/** Build the reference from the text of an `action.yml`. */
export function parseGhaAction(source: string, version: string): GhaActionReference {
  const action = yaml.load(source) as ActionYaml;
  const steps = action.runs?.steps ?? [];

  // Every `action:` value a step tests for. They are listed in the order the
  // `action` input documents them, which is written for a reader; a value it
  // does not document follows, in the order the steps first test for it.
  const tested: string[] = [];
  for (const step of steps) {
    for (const name of stepActions(step) ?? []) {
      if (!tested.includes(name)) tested.push(name);
    }
  }
  const summaries = actionSummaries(action.inputs?.action?.description, tested);
  const names = [...summaries.keys(), ...tested.filter((name) => !summaries.has(name))];

  const readers = new Map<string, Set<string>>();
  const stepsById = new Map<string, string[]>();
  for (const step of steps) {
    const runsFor = stepActions(step) ?? names;
    if (typeof step.id === 'string') stepsById.set(step.id, runsFor);
    // The whole step, not just `env:` and `with:`: an input tested only in
    // `if:` (the token warning) or spliced into `run:` is still read.
    for (const input of matchAll(INPUT_REFERENCE, JSON.stringify(step))) {
      const set = readers.get(input) ?? new Set<string>();
      for (const name of runsFor) set.add(name);
      readers.set(input, set);
    }
  }

  const inputs = Object.entries(action.inputs ?? {}).map(([name, spec]) => {
    const { description, requiredBy } = requiredByLine(spec?.description);
    const actions = inOrder(names, readers.get(name) ?? new Set());
    const required = spec?.required === true;
    return {
      name,
      description: stringOrNull(description),
      default: stringOrNull(spec?.default),
      required,
      actions,
      // Only an action that reads the input can require it; a name the line
      // gets wrong is dropped rather than published.
      requiredBy: required ? actions : inOrder(actions, new Set(requiredBy)),
    };
  });

  const outputs = Object.entries(action.outputs ?? {}).map(([name, spec]) => {
    const setters = new Set<string>();
    for (const id of matchAll(STEP_OUTPUT_REFERENCE, spec?.value ?? '')) {
      for (const actionName of stepsById.get(id) ?? []) setters.add(actionName);
    }
    return {
      name,
      description: stringOrNull(spec?.description),
      actions: inOrder(names, setters),
    };
  });

  return {
    name: action.name,
    description: stringOrNull(action.description),
    version,
    actions: names.map((name) => ({ name, summary: summaries.get(name) ?? null })),
    inputs,
    outputs,
  };
}

const STAMP = /^# Mergifyio\/gha-mergify-ci action\.yml at (\S+), git blob ([0-9a-f]{40})\n/;

export interface VendoredAction {
  /** The release tag the stamp says the body was taken at. */
  tag: string;
  /** The body's git blob id, as `gh api repos/…/contents/action.yml?ref=<tag> --jq .sha` reports it. */
  blob: string;
  /** The upstream `action.yml`, without the stamp. */
  body: string;
}

/** The id git gives `content` as a blob, so the body can be checked against its stamp offline. */
export function gitBlobId(content: string): string {
  const bytes = Buffer.from(content, 'utf-8');
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}

/**
 * Split the vendored file into its stamp and body, and refuse it unless it is
 * the `action.yml` of `pinned`. Throws on a missing stamp, a tag other than the
 * pinned version, or a body whose blob is not the one stamped (edited by hand,
 * or re-downloaded without re-stamping).
 */
export function readVendoredAction(text: string, pinned: string): VendoredAction {
  const how = `re-vendor ${GHA_ACTION_PATH} from ${GHA_ACTION_REPOSITORY} at ${pinned}`;
  const stamp = text.match(STAMP);
  if (!stamp) {
    throw new Error(
      `${GHA_ACTION_PATH} has no "# ${GHA_ACTION_REPOSITORY} action.yml at <tag>, git blob <sha>" first line: ${how}`
    );
  }
  const [line, tag, blob] = stamp;
  if (tag !== pinned) {
    throw new Error(
      `gha-mergify-ci-version.json pins ${pinned}, but ${GHA_ACTION_PATH} is the action.yml of ${tag}: ${how}`
    );
  }
  const body = text.slice(line.length);
  const actual = gitBlobId(body);
  if (actual !== blob) {
    throw new Error(
      `${GHA_ACTION_PATH} is stamped as git blob ${blob} of ${tag}, but its body is ${actual}: ${how}`
    );
  }
  return { tag, blob, body };
}

let cached: GhaActionReference | null = null;

/** Read, check and memoize the vendored action. cwd is the project root at build time. */
export function loadGhaAction(): GhaActionReference {
  if (!cached) {
    const pinned = ghaMergifyCiVersion.version;
    const { body } = readVendoredAction(fs.readFileSync(GHA_ACTION_PATH, 'utf-8'), pinned);
    cached = parseGhaAction(body, pinned);
  }
  return cached;
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

export type DescriptionBlock =
  | { kind: 'paragraph'; html: string }
  | { kind: 'list'; items: string[] };

/**
 * Turn an `action.yml` description into paragraphs and bullet lists of safe
 * HTML. The descriptions are YAML block scalars hard-wrapped at ~72 columns, so
 * consecutive lines are one paragraph, a blank line ends it, and `* ` or `- `
 * lines are list items.
 */
export function descriptionBlocks(text: string): DescriptionBlock[] {
  const blocks: DescriptionBlock[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length > 0)
      blocks.push({ kind: 'paragraph', html: helpToHtml(paragraph.join(' ')) });
    paragraph = [];
  };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const bullet = line.match(/^[*-]\s+(.+)$/);
    if (bullet) {
      flush();
      const last = blocks[blocks.length - 1];
      const item = helpToHtml(bullet[1]);
      if (last?.kind === 'list') last.items.push(item);
      else blocks.push({ kind: 'list', items: [item] });
    } else if (line === '') {
      flush();
    } else {
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}

/** Anchor ids, prefixed so an input and an output of the same name (`scopes`) don't collide. */
export const anchors = {
  action: (name: string) => `action-${name}`,
  input: (name: string) => `input-${name}`,
  output: (name: string) => `output-${name}`,
};
