import { describe, expect, it } from 'vitest';
import apiSchema from '../../public/api-schemas.json';
import configSchema from '../../public/mergify-configuration-schema.json';
import { readEnumChoices, resolveRef } from './enumChoices';

// This reader spans an engine-side migration, so each shape it has to survive
// is pinned here. Every failure mode below is silent by nature — a shape it
// mishandles renders a header with an empty or subtly wrong table rather than
// failing the build — which is why they are tested rather than left to review.
describe('readEnumChoices', () => {
  it('reads the target shape: x-mergify-enum aligned with enum', () => {
    expect(
      readEnumChoices(
        {},
        {
          enum: ['running', 'failed'],
          'x-mergify-enum': [
            { title: 'CI Running', description: 'Checks are running.' },
            { title: 'Failed', description: 'Checks failed.', deprecated: true },
          ],
        }
      )
    ).toEqual([
      {
        value: 'running',
        title: 'CI Running',
        description: 'Checks are running.',
        deprecated: false,
      },
      { value: 'failed', title: 'Failed', description: 'Checks failed.', deprecated: true },
    ]);
  });

  it('falls back to the x-enum-descriptions map while the engine migrates', () => {
    expect(
      readEnumChoices(
        {},
        { enum: ['a', 'b'], 'x-enum-descriptions': { a: 'First.', b: 'Second.' } }
      )
    ).toEqual([
      { value: 'a', title: undefined, description: 'First.', deprecated: false },
      { value: 'b', title: undefined, description: 'Second.', deprecated: false },
    ]);
  });

  it('merges the two shapes so a half-migrated node keeps every description', () => {
    // Both shapes can coexist on one node mid-migration; treating them as
    // alternatives would blank values the schema still documents.
    const choices = readEnumChoices(
      {},
      {
        enum: ['a', 'b', 'c'],
        'x-mergify-enum': [{ description: 'A new' }, {}, {}],
        'x-enum-descriptions': { a: 'A old', b: 'B old', c: 'C old' },
      }
    );
    expect(choices.map((c) => c.description)).toEqual(['A new', 'B old', 'C old']);
  });

  it('flattens a composed Literal published as anyOf of const/enum branches', () => {
    expect(
      readEnumChoices(
        {},
        {
          anyOf: [{ const: 'NONE' }, { enum: ['MERGED', 'DEQUEUED'] }],
          'x-enum-descriptions': { NONE: 'Not queued.' },
        }
      ).map((c) => c.value)
    ).toEqual(['NONE', 'MERGED', 'DEQUEUED']);
  });

  it('resolves a $ref to a hoisted component', () => {
    const root = {
      components: {
        schemas: {
          Outcome: {
            enum: ['success'],
            'x-mergify-enum': [{ title: 'Success', description: 'It passed.' }],
          },
        },
      },
    };
    expect(readEnumChoices(root, { $ref: '#/components/schemas/Outcome' })).toEqual([
      { value: 'success', title: 'Success', description: 'It passed.', deprecated: false },
    ]);
  });

  it('resolves a $ref sitting inside an anyOf branch', () => {
    // What an optional hoisted enum looks like: {anyOf: [{$ref}, {type: null}]}.
    // Resolving only the top node would yield nothing at all.
    const root = {
      $defs: {
        Reason: {
          enum: ['A', 'B'],
          'x-mergify-enum': [{ description: 'a' }, { description: 'b' }],
        },
      },
    };
    const choices = readEnumChoices(root, {
      anyOf: [{ $ref: '#/$defs/Reason' }, { type: 'null' }],
    });
    expect(choices.map((c) => c.value)).toEqual(['A', 'B']);
    expect(choices.map((c) => c.description)).toEqual(['a', 'b']);
  });

  it('reads metadata published as a $ref sibling, not only on the target', () => {
    // Pydantic publishes an annotation inline for an inlined type but as a
    // sibling of `$ref` once the type is hoisted into `$defs`.
    const root = { $defs: { Reason: { enum: ['A', 'B'] } } };
    const choices = readEnumChoices(root, {
      $ref: '#/$defs/Reason',
      'x-mergify-enum': [{ description: 'first' }, { description: 'second' }],
    });
    expect(choices.map((c) => c.description)).toEqual(['first', 'second']);
  });

  it('ignores a misaligned x-mergify-enum rather than shifting every description', () => {
    // Positional metadata whose length disagrees with `enum` describes the
    // wrong values from the first divergence onward. Publishing nothing beats
    // publishing confidently wrong sentences.
    const choices = readEnumChoices(
      {},
      {
        enum: ['b', 'c'],
        'x-mergify-enum': [
          { description: 'desc for a' },
          { description: 'desc for b' },
          { description: 'desc for c' },
        ],
      }
    );
    expect(choices.map((c) => c.description)).toEqual(['', '']);
  });

  it('leaves values undocumented rather than dropping them', () => {
    const choices = readEnumChoices(
      {},
      { enum: ['a', 'b'], 'x-mergify-enum': [{ title: 'A' }, {}] }
    );
    expect(choices.map((c) => c.value)).toEqual(['a', 'b']);
    expect(choices.map((c) => c.description)).toEqual(['', '']);
  });

  it('reads a single-value choice set published as a non-string const', () => {
    // A one-value literal publishes `{const: 1}` where a two-value one
    // publishes `{enum: [1, 2]}`; accepting only string consts would render
    // the second and silently drop the first.
    expect(readEnumChoices({}, { const: 1, 'x-mergify-enum': [{ description: 'one' }] })).toEqual([
      { value: '1', title: undefined, description: 'one', deprecated: false },
    ]);
  });

  it('degrades to an empty list instead of throwing on unusable input', () => {
    expect(readEnumChoices({}, undefined)).toEqual([]);
    expect(readEnumChoices({}, { type: 'string' })).toEqual([]);
    expect(readEnumChoices({}, { $ref: '#/nope/missing' })).toEqual([]);
  });
});

describe('resolveRef', () => {
  it('stops on a dangling ref rather than looping or throwing', () => {
    expect(resolveRef({}, { $ref: '#/a/b' })).toEqual({ $ref: '#/a/b' });
  });

  it('does not throw on a pointer containing a stray percent sign', () => {
    // Hand-rolled `decodeURIComponent` on each segment raises URIError here,
    // which would break the never-throws contract during SSR.
    const root = { components: { schemas: { 'A%B': { enum: ['x'] } } } };
    expect(() => resolveRef(root, { $ref: '#/components/schemas/A%B' })).not.toThrow();
  });

  it('returns non-ref nodes untouched', () => {
    expect(resolveRef({}, { enum: ['x'] })).toEqual({ enum: ['x'] });
  });
});

// The cases above are synthetic. These bind the reader to the two schemas the
// site actually renders, so a sync that changes shape — or reverts one — fails
// here instead of silently publishing a table of blank cells.
function at(root: unknown, ...path: string[]): unknown {
  let current = root;
  for (const key of path) {
    current = (current as Record<string, unknown> | undefined)?.[key];
  }
  return current;
}

describe('the real synced schemas', () => {
  it('documents every batch status code in the API schema', () => {
    const code = at(apiSchema, 'components', 'schemas', 'BatchStatus', 'properties', 'code');
    const choices = readEnumChoices(apiSchema, code);
    expect(choices.length).toBeGreaterThan(0);
    expect(choices.filter((c) => c.description.trim() === '')).toEqual([]);
  });

  it('documents every dequeue reason in the configuration schema', () => {
    const reason = at(
      configSchema,
      '$defs',
      'PullRequestAttributes',
      'properties',
      'queue-dequeue-reason'
    );
    const choices = readEnumChoices(configSchema, reason);
    expect(choices.length).toBeGreaterThan(0);
    expect(choices.filter((c) => c.description.trim() === '')).toEqual([]);
  });
});
