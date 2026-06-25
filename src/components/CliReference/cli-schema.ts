import fs from 'node:fs';
import { escape } from '~/util/html-entities';
import { slugify } from '~/util/slugify';

/**
 * Types and helpers for the CLI reference, mirroring the HTTP API reference's
 * `openapi.ts`. The source of truth is `public/cli-schema.json`, produced by
 * `mergify _internal dump-cli-schema` (clap introspection) — the CLI counterpart
 * of the OpenAPI spec that drives `/api`.
 */

export interface CliPossibleValue {
  name: string;
  help: string | null;
}

export interface CliArg {
  id: string;
  kind: 'flag' | 'option' | 'positional';
  short: string | null;
  long: string | null;
  valueNames: string[];
  help: string | null;
  longHelp: string | null;
  required: boolean;
  global: boolean;
  default: string | null;
  possibleValues: CliPossibleValue[];
  numArgs: string;
  env: string | null;
  valueHint: string | null;
}

export interface CliCommandNode {
  name: string;
  path: string[];
  about: string | null;
  longAbout: string | null;
  usage: string;
  aliases: string[];
  subcommandRequired: boolean;
  source: string;
  args: CliArg[];
  commands: CliCommandNode[];
}

export interface CliSchema {
  schemaVersion: number;
  generator: string;
  cli: { name: string; version: string; about: string | null };
  command: CliCommandNode;
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

let cached: CliSchema | null = null;

/** Read and memoize the CLI schema. cwd is the project root at build time. */
export function loadCliSchema(): CliSchema {
  if (!cached) {
    cached = JSON.parse(fs.readFileSync('public/cli-schema.json', 'utf-8')) as CliSchema;
  }
  return cached;
}

/** Split a display command string ("mergify tests show") into its path. */
export function splitCommand(command: string): string[] {
  return command.trim().split(/\s+/);
}

/** Locate a command node by its full path, walking the subcommand tree. */
export function findCommand(root: CliCommandNode, path: string[]): CliCommandNode | undefined {
  if (path.length === 0) return undefined;
  let node: CliCommandNode | undefined = root.name === path[0] ? root : undefined;
  for (const segment of path.slice(1)) {
    node = node?.commands.find((c) => c.name === segment);
    if (!node) return undefined;
  }
  return node;
}

/**
 * Global args (`global: true`) declared on ancestor commands, which the leaf
 * accepts but doesn't re-list. Deduped by flag name, nearest the root first.
 * Mirrors how clap surfaces global options on every subcommand.
 */
export function collectInheritedGlobals(root: CliCommandNode, path: string[]): CliArg[] {
  const result: CliArg[] = [];
  const seen = new Set<string>();
  let node: CliCommandNode | undefined = root.name === path[0] ? root : undefined;
  // Visit every ancestor strictly above the leaf command.
  for (let i = 0; node && i < path.length - 1; i++) {
    for (const arg of node.args) {
      const key = arg.long ?? arg.short ?? arg.id;
      if (!arg.global || seen.has(key)) continue;
      seen.add(key);
      result.push(arg);
    }
    node = node.commands.find((c) => c.name === path[i + 1]);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Argument helpers
// ---------------------------------------------------------------------------

/** A positional or option that accepts more than one value (clap `1..`, `0..`). */
export function isVariadic(arg: CliArg): boolean {
  return arg.numArgs.includes('..');
}

/** Positionals first, then options and flags, preserving schema order. */
export function partitionArgs(args: CliArg[]): {
  positionals: CliArg[];
  options: CliArg[];
} {
  return {
    positionals: args.filter((a) => a.kind === 'positional'),
    options: args.filter((a) => a.kind === 'option' || a.kind === 'flag'),
  };
}

/** The flag signature shown as the row name, e.g. `-r, --repository` or `--json`. */
export function optionSignature(arg: CliArg): string {
  const names: string[] = [];
  if (arg.short) names.push(`-${arg.short}`);
  if (arg.long) names.push(`--${arg.long}`);
  return names.join(', ') || arg.id;
}

/** The value placeholder for an option/positional, e.g. `<REPOSITORY>`; null for flags. */
export function valuePlaceholder(arg: CliArg): string | null {
  if (isFlagLike(arg) || arg.valueNames.length === 0) return null;
  const placeholder = arg.valueNames.map((n) => `<${n}>`).join(' ');
  return isVariadic(arg) ? `${placeholder}...` : placeholder;
}

/**
 * Render help text to safe HTML, turning backtick spans into inline `<code>`.
 * clap help uses both RST double-backticks (``ENV_VAR``) and single backticks
 * (`--flag`); everything else is HTML-escaped.
 */
export function helpToHtml(text: string): string {
  const pattern = /``([^`]+)``|`([^`]+)`/g;
  let html = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    html += escape(text.slice(lastIndex, match.index));
    html += `<code>${escape(match[1] ?? match[2])}</code>`;
    lastIndex = pattern.lastIndex;
  }
  html += escape(text.slice(lastIndex));
  return html;
}

/** clap value hints (camelCased variant names) → friendly type labels. */
const VALUE_HINT_LABELS: Record<string, string> = {
  anyPath: 'path',
  filePath: 'path',
  dirPath: 'path',
  executablePath: 'path',
  url: 'url',
  hostname: 'hostname',
  emailAddress: 'email',
  username: 'username',
  commandName: 'command',
  commandString: 'command',
};

/**
 * Short type label for the badge: enum values, the value hint, or the kind.
 * The schema carries no numeric type, so plain options fall back to 'string'.
 */
export function typeLabel(arg: CliArg): string {
  if (arg.possibleValues.length > 0) {
    return arg.possibleValues.map((v) => v.name).join(' | ');
  }
  if (isFlagLike(arg)) return 'flag';
  if (arg.valueHint) return VALUE_HINT_LABELS[arg.valueHint] ?? 'string';
  return 'string';
}

/**
 * A flag, or a zero-arg option clap models as a boolean switch (e.g.
 * `stack push --draft`: an option with `numArgs: '0'` and a value name). Without
 * this, such switches render a bogus `<VALUE>` placeholder and a `string` type.
 */
export function isFlagLike(arg: CliArg): boolean {
  return arg.kind === 'flag' || (arg.kind === 'option' && arg.numArgs === '0');
}

// ---------------------------------------------------------------------------
// Top-level grouping — the CLI counterpart of openapi.ts's tag grouping.
//
// `/cli/[group]` and the `/cli` index grid both derive from `groupTopLevel`, so
// a command added to the schema reaches the docs on the next build with no
// hand-editing — the same contract as the OpenAPI-driven `/api` reference.
// ---------------------------------------------------------------------------

/** A top-level command: a group (e.g. `tests`) or a lone leaf (e.g. `self-update`). */
export interface CliGroup {
  /** Top-level node name: `queue`, `self-update`, … */
  name: string;
  /** URL slug; single-segment lowercase names slug to themselves. */
  slug: string;
  /** Outward-facing card/page heading. */
  label: string;
  /** The top-level node itself (group or lone leaf). */
  node: CliCommandNode;
  /** Display strings of every runnable leaf, DFS pre-order (`mergify tests show`). */
  leaves: string[];
  /** Whether any leaf is deprecated — surfaced as a grid indicator. */
  deprecated: boolean;
}

/**
 * Editorial order for the index grid and nav — capability-first, not clap's
 * registration order; maintenance (`self-update`) trails. A top-level command
 * missing here still renders, appended after these.
 */
export const GROUP_ORDER: string[] = [
  'queue',
  'stack',
  'ci',
  'tests',
  'freeze',
  'config',
  'self-update',
  'completions',
];

/** Card/page headings — the CLI counterpart of `TAG_LABELS`. */
export const GROUP_LABELS: Record<string, string> = {
  queue: 'Merge Queue',
  stack: 'Stacked Pull Requests',
  ci: 'CI Insights',
  tests: 'Test Health',
  freeze: 'Scheduled Freezes',
  config: 'Configuration',
  'self-update': 'Maintenance',
  completions: 'Shell Completions',
};

/**
 * Outward-facing one-line value props for the index grid — the CLI counterpart
 * of `TAG_DESCRIPTIONS`. Written for evaluators, not copied from the schema's
 * inward-facing `about` strings.
 */
export const GROUP_DESCRIPTIONS: Record<string, string> = {
  queue: 'Pause, unpause, and inspect the merge queue from scripts and incident runbooks.',
  stack: 'Create, reorder, sync, and push stacked pull requests entirely from git.',
  ci: 'Send JUnit results and pull request scopes from any CI provider into Mergify.',
  tests: 'Look up test health by name and manage the flaky-test quarantine.',
  freeze: 'Schedule and manage merge freezes for release windows and maintenance.',
  config: 'Validate your Mergify configuration and simulate actions before you merge.',
  'self-update': 'Update the Mergify CLI to the latest release.',
  completions: 'Generate a shell completion script to tab-complete Mergify CLI commands and flags.',
};

/**
 * Conceptual "learn more" home for each group, linked above its command cards
 * so a generated reference page never orphans the user's mental model. Optional
 * — a group without an entry (e.g. `self-update`) simply omits the link.
 */
export const GROUP_BACKLINKS: Record<string, { text: string; href: string }> = {
  queue: { text: 'Merge queue monitoring', href: '/merge-queue/monitoring' },
  stack: { text: 'Stacked pull requests', href: '/stacks' },
  ci: { text: 'CI Insights', href: '/ci-insights' },
  tests: { text: 'Test quarantine', href: '/test-insights/quarantine' },
  freeze: { text: 'Scheduled freezes', href: '/merge-protections/freeze' },
  config: { text: 'Configuration file', href: '/configuration/file-format' },
};

/** Outward-facing label, falling back to a title-cased name for new commands. */
export function humanizeCommand(name: string): string {
  return (
    GROUP_LABELS[name] ??
    name
      .split('-')
      .map((word) => (word === 'ci' ? 'CI' : word.charAt(0).toUpperCase() + word.slice(1)))
      .join(' ')
  );
}

/** Slug for a top-level command name; shares the reference-wide slug convention. */
export function slugifyCommand(name: string): string {
  return slugify(name);
}

/** clap exposes no deprecated flag; the only signal is a note in the about text. */
export function isDeprecated(node: CliCommandNode): boolean {
  return /\bdeprecat/i.test(node.about ?? '');
}

/** The replacement command named in a deprecation note (`use \`junit-process\``). */
export function deprecationReplacement(node: CliCommandNode): string | null {
  const match = (node.about ?? '').match(/deprecated:\s*use\s*`([^`]+)`/i);
  return match ? match[1] : null;
}

/** Every runnable leaf under a node, DFS pre-order. */
function collectLeafNodes(node: CliCommandNode): CliCommandNode[] {
  return node.commands.length === 0 ? [node] : node.commands.flatMap(collectLeafNodes);
}

/**
 * Every top-level command as a group, ordered by `GROUP_ORDER` with unknown
 * commands appended. A top-level leaf (`self-update`) becomes a single-leaf
 * group, so every command in the schema owns a page and a grid card.
 */
export function groupTopLevel(root: CliCommandNode): CliGroup[] {
  const byName = new Map(root.commands.map((c) => [c.name, c]));
  const ordered = [
    ...GROUP_ORDER.filter((name) => byName.has(name)),
    ...root.commands.map((c) => c.name).filter((name) => !GROUP_ORDER.includes(name)),
  ];
  return ordered.map((name) => {
    const node = byName.get(name) as CliCommandNode;
    const leafNodes = collectLeafNodes(node);
    return {
      name,
      slug: slugifyCommand(name),
      label: humanizeCommand(name),
      node,
      leaves: leafNodes.map((leaf) => leaf.path.join(' ')),
      deprecated: leafNodes.some(isDeprecated),
    };
  });
}

/**
 * Right-sidebar TOC entries for a group page, one per leaf command. The slug
 * matches the `<h2 id>` that `CliCommand` renders (component-owned, not a
 * markdown heading) — the same wiring `getHeadingsForEndpoints` uses for `/api`.
 */
export function getHeadingsForCommands(
  commands: string[]
): Array<{ depth: number; slug: string; text: string }> {
  return commands.map((command) => ({
    depth: 2,
    slug: slugify(command),
    text: command,
  }));
}
