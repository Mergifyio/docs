import { describe, expect, test } from 'vitest';
import {
  type CliCommandNode,
  findCommand,
  GROUP_BACKLINKS,
  GROUP_DESCRIPTIONS,
  GROUP_LABELS,
  groupDescription,
  groupTopLevel,
  isFlagLike,
  loadCliSchema,
  splitCommand,
  valuePlaceholder,
} from './cli-schema';

const schema = loadCliSchema();
const groups = groupTopLevel(schema.command);

describe('CLI reference grouping', () => {
  test('every top-level command becomes a group', () => {
    const schemaNames = schema.command.commands.map((c) => c.name).sort();
    const groupNames = groups.map((g) => g.name).sort();
    expect(groupNames).toEqual(schemaNames);
  });

  // A new command auto-derives its copy (humanizeCommand + the schema `about`),
  // so it needs no hand-written entry. The remaining risk runs the other way: an
  // editorial entry orphaned when a command is renamed or dropped in the schema.
  // Guard that drift — the blank-copy case is impossible by construction.
  test('editorial maps carry no entry for a missing command', () => {
    const commands = new Set(schema.command.commands.map((c) => c.name));
    const editorial: Array<[string, Record<string, unknown>]> = [
      ['GROUP_LABELS', GROUP_LABELS],
      ['GROUP_DESCRIPTIONS', GROUP_DESCRIPTIONS],
      ['GROUP_BACKLINKS', GROUP_BACKLINKS],
    ];
    for (const [mapName, map] of editorial) {
      for (const name of Object.keys(map)) {
        expect(commands.has(name), `${mapName} has a stale entry "${name}"`).toBe(true);
      }
    }
  });

  // CliCommand throws on a group node, so every leaf the group page renders must
  // resolve to a runnable command.
  test('every leaf resolves to a runnable command', () => {
    for (const group of groups) {
      expect(group.leaves.length).toBeGreaterThan(0);
      for (const command of group.leaves) {
        const node = findCommand(schema.command, splitCommand(command));
        expect(node, `unresolved leaf "${command}"`).toBeDefined();
        expect(node?.commands.length, `"${command}" is a group, not a leaf`).toBe(0);
      }
    }
  });

  test('nested subgroups are flattened into their parent group', () => {
    const tests = groups.find((g) => g.name === 'tests');
    expect(tests?.leaves).toContain('mergify tests show');
    expect(tests?.leaves).toContain('mergify tests quarantines add');
  });
});

describe('groupDescription fallback', () => {
  // Every shipped group has an editorial entry, so the schema alone never
  // exercises the lower tiers — drive them with a synthetic command node.
  const node = (about: string | null): CliCommandNode => ({
    name: 'demo',
    path: ['mergify', 'demo'],
    about,
    longAbout: null,
    usage: 'mergify demo',
    aliases: [],
    subcommandRequired: false,
    source: 'test',
    args: [],
    commands: [],
  });

  test('prefers an editorial entry over the schema about', () => {
    expect(groupDescription('queue', node('inward-facing help'))).toBe(GROUP_DESCRIPTIONS.queue);
  });

  test('falls back to the schema about for a command with no entry', () => {
    expect(groupDescription('newcmd', node('Inspect the thing.'))).toBe('Inspect the thing.');
  });

  test('treats a whitespace-only editorial entry as absent', () => {
    const original = GROUP_DESCRIPTIONS.queue;
    GROUP_DESCRIPTIONS.queue = '   ';
    try {
      expect(groupDescription('queue', node('Inspect the thing.'))).toBe('Inspect the thing.');
    } finally {
      GROUP_DESCRIPTIONS.queue = original;
    }
  });

  test('falls back to a generated sentence when about is blank or missing', () => {
    expect(groupDescription('newcmd', node('   '))).toBe('Commands for mergify newcmd.');
    expect(groupDescription('newcmd', node(null))).toBe('Commands for mergify newcmd.');
  });
});

describe('flag-like options', () => {
  // clap models `stack push --draft` as a zero-arg option with a value name;
  // without isFlagLike it would render a bogus <CREATE_AS_DRAFT> placeholder.
  test('a zero-arg option renders no value placeholder', () => {
    const push = findCommand(schema.command, splitCommand('mergify stack push'));
    const draft = push?.args.find((arg) => arg.long === 'draft');
    expect(draft, 'stack push --draft not found in schema').toBeDefined();
    expect(isFlagLike(draft!)).toBe(true);
    expect(valuePlaceholder(draft!)).toBeNull();
  });
});
