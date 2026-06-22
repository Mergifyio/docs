import { describe, expect, test } from 'vitest';
import {
  findCommand,
  GROUP_DESCRIPTIONS,
  GROUP_LABELS,
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

  // Mirrors the API reference's TAG_DESCRIPTIONS discipline: a new top-level
  // command must be given outward-facing copy, caught here rather than shipping
  // a bare fallback to the storefront grid and the nav.
  test('every group has an editorial label and description', () => {
    for (const group of groups) {
      expect(GROUP_LABELS[group.name], `GROUP_LABELS missing "${group.name}"`).toBeDefined();
      expect(
        GROUP_DESCRIPTIONS[group.name],
        `GROUP_DESCRIPTIONS missing "${group.name}"`
      ).toBeDefined();
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
