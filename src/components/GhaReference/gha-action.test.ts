import fs from 'node:fs';
import { describe, expect, test } from 'vitest';
import ghaMergifyCiVersion from '~/data/gha-mergify-ci-version.json';
import {
  descriptionBlocks,
  GHA_ACTION_PATH,
  gitBlobId,
  loadGhaAction,
  parseGhaAction,
  readVendoredAction,
} from './gha-action';

// Loaded inside each test, so a vendored file the stamp check refuses fails
// those tests with its reason instead of failing the whole file at import.
const input = (name: string) => loadGhaAction().inputs.find((i) => i.name === name);
const output = (name: string) => loadGhaAction().outputs.find((o) => o.name === name);

// The version sync bumps gha-mergify-ci-version.json without touching the
// vendored action.yml, so this is what stops its pull request going green with
// a page that still describes the previous release.
describe('vendored gha-mergify-ci action is the pinned release', () => {
  test('its stamp names the version gha-mergify-ci-version.json pins, and its body matches', () => {
    const vendored = readVendoredAction(
      fs.readFileSync(GHA_ACTION_PATH, 'utf-8'),
      ghaMergifyCiVersion.version
    );
    expect(vendored.tag).toBe(ghaMergifyCiVersion.version);
  });
});

describe('readVendoredAction', () => {
  const body = 'name: example\n';
  const stamped = (tag: string, blob = gitBlobId(body)) =>
    `# Mergifyio/gha-mergify-ci action.yml at ${tag}, git blob ${blob}\n${body}`;

  test('computes the blob id git does', () => {
    // `printf 'name: example\n' | git hash-object --stdin`
    expect(gitBlobId(body)).toBe('2551cb17573fec7452e355241d2756547919416a');
  });

  test('returns the body without the stamp', () => {
    expect(readVendoredAction(stamped('v2'), 'v2')).toEqual({
      tag: 'v2',
      blob: gitBlobId(body),
      body,
    });
  });

  test('refuses a file taken at another release than the pinned one', () => {
    expect(() => readVendoredAction(stamped('v1'), 'v2')).toThrow(
      /pins v2, but .* is the action\.yml of v1/
    );
  });

  test('refuses a body that is not the stamped blob', () => {
    expect(() => readVendoredAction(stamped('v2', '0'.repeat(40)), 'v2')).toThrow(
      /stamped as git blob 0{40} of v2/
    );
  });

  test('refuses a file with no stamp', () => {
    expect(() => readVendoredAction(body, 'v2')).toThrow(/has no .* first line/);
  });
});

describe('vendored gha-mergify-ci action', () => {
  test('every input and output has a description', () => {
    for (const entry of [...loadGhaAction().inputs, ...loadGhaAction().outputs]) {
      expect(entry.description, `${entry.name} has no description`).not.toBeNull();
    }
  });

  test('every input is read by some action', () => {
    for (const entry of loadGhaAction().inputs) {
      expect(entry.actions.length, `no step reads input "${entry.name}"`).toBeGreaterThan(0);
    }
  });

  test('every output is set by some action', () => {
    for (const entry of loadGhaAction().outputs) {
      expect(entry.actions.length, `no step sets output "${entry.name}"`).toBeGreaterThan(0);
    }
  });

  test('every action value has a summary', () => {
    for (const action of loadGhaAction().actions) {
      expect(action.summary, `the action input lists no "${action.name}"`).not.toBeNull();
    }
  });

  // Pinned against the file itself: these are the inputs the GitHub Actions
  // integration page sends readers here for.
  test('scope detection inputs map to the actions that read them', () => {
    expect(input('base')?.actions).toEqual(['scopes']);
    expect(input('head')?.actions).toEqual(['scopes']);
    expect(input('all_scopes')?.actions).toEqual(['scopes', 'scopes-upload']);
    expect(input('test_step_outcome')?.actions).toEqual(['junit-process']);
    expect(input('all_scopes')?.default).toBe('false');
  });

  test('an input read outside any action-specific step applies to every action', () => {
    const all = loadGhaAction().actions.map((a) => a.name);
    expect(input('action')?.actions).toEqual(all);
    expect(input('mergify_cli_version')?.actions).toEqual(all);
  });
});

describe('parseGhaAction', () => {
  const source = `
name: example
inputs:
  action:
    description: |
      Pick one:
      * one: the first
      * two: the second
    default: one
  only_two:
    description: Read by two
  in_condition:
    description: Tested in if only
  unused:
    description: Nobody reads this
outputs:
  result:
    description: The result
    value: \${{ steps.first.outputs.x || steps.second.outputs.x }}
runs:
  using: composite
  steps:
    - shell: bash
      if: inputs.action != 'one' && inputs.action != 'two'
      run: echo "\${{ inputs.action }}"
    - id: first
      if: inputs.action == 'one'
      run: echo
    - id: second
      if: inputs.in_condition && (inputs.action == 'two')
      env:
        X: \${{ inputs.only_two }}
      run: echo
`;
  const parsed = parseGhaAction(source, 'v1');

  test('actions come from equality tests, in first-seen order, with summaries', () => {
    expect(parsed.actions).toEqual([
      { name: 'one', summary: 'the first' },
      { name: 'two', summary: 'the second' },
    ]);
  });

  test('inputs are attributed to the steps that reference them anywhere', () => {
    const byName = Object.fromEntries(parsed.inputs.map((i) => [i.name, i.actions]));
    expect(byName).toEqual({
      action: ['one', 'two'],
      only_two: ['two'],
      in_condition: ['two'],
      unused: [],
    });
  });

  test('outputs follow the step ids in their value', () => {
    expect(parsed.outputs[0].actions).toEqual(['one', 'two']);
  });

  test('scalar defaults are strings, missing fields null or false', () => {
    const action = parsed.inputs[0];
    expect(action.default).toBe('one');
    expect(action.required).toBe(false);
    expect(parsed.inputs[1].default).toBeNull();
  });
});

describe('descriptionBlocks', () => {
  test('joins wrapped lines, splits bullets into a list, escapes, and codes backticks', () => {
    expect(descriptionBlocks('The <action>:\n* a: first `x`\n* b: second\nwrapped\nline')).toEqual([
      { kind: 'paragraph', html: 'The &lt;action&gt;:' },
      { kind: 'list', items: ['a: first <code>x</code>', 'b: second'] },
      { kind: 'paragraph', html: 'wrapped line' },
    ]);
  });
});

describe('output', () => {
  test('scopes output is set by the scopes action', () => {
    expect(output('scopes')?.actions).toEqual(['scopes']);
  });
});
