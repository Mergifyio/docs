import fs from 'node:fs';
import { escape } from '~/util/html-entities';

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
  if (arg.kind === 'flag' || arg.valueNames.length === 0) return null;
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
  if (arg.kind === 'flag') return 'flag';
  if (arg.valueHint) return VALUE_HINT_LABELS[arg.valueHint] ?? 'string';
  return 'string';
}
