import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { getValueType } from '~/components/Tables/ConfigOptions';
import { OptionsTableBase } from '~/components/Tables/OptionsTable';
import PullRequestAttributes from '~/components/Tables/PullRequestAttributes';
import { documentedEntries, isExperimental } from './experimental';
import { expandMdxComponents } from './schemaToMarkdown';

// The tables that read the synced schema directly (the markdown export, the
// attributes list) get this one instead, so both shapes of the flag are covered:
// on the property itself, and on a `$defs` entry the property reaches.
const schema = vi.hoisted(() => ({
  $defs: {
    ResolverModel: {
      'x-mergify-experimental': true,
      properties: { strategy: { type: 'string' } },
      title: 'Resolver',
      type: 'object',
    },
    QueueRuleModel: {
      properties: {
        name: { description: 'The name of the queue rule.', type: 'string' },
        preview_mode: { title: 'Preview Mode', type: 'boolean', 'x-mergify-experimental': true },
        resolvers: { items: { $ref: '#/$defs/ResolverModel' }, type: 'array' },
      },
      title: 'Queue rule',
      type: 'object',
    },
    PullRequestAttributes: {
      properties: {
        author: { description: 'The author of the pull request.', type: 'string' },
        'preview-state': { type: 'string', 'x-mergify-experimental': true },
      },
      type: 'object',
    },
  },
}));

vi.mock('../../public/mergify-configuration-schema.json', () => ({ default: schema }));

const flaggedDef = { $defs: { Resolver: { 'x-mergify-experimental': true, type: 'object' } } };
const publicDef = { $defs: { Resolver: { type: 'object' } } };
const ref = { $ref: '#/$defs/Resolver' };

describe('isExperimental', () => {
  it('is true for a node carrying the flag', () => {
    expect(isExperimental({}, { type: 'boolean', 'x-mergify-experimental': true })).toBe(true);
  });

  it('is true for a $ref to a flagged $defs entry', () => {
    expect(isExperimental(flaggedDef, ref)).toBe(true);
  });

  it.each([
    ['items', { items: ref, type: 'array' }],
    ['anyOf', { anyOf: [ref, { type: 'null' }] }],
    ['oneOf', { oneOf: [{ type: 'string' }, ref] }],
    ['allOf', { allOf: [ref] }],
    ['additionalProperties', { additionalProperties: ref, type: 'object' }],
    ['nested wrappers', { anyOf: [{ items: ref, type: 'array' }, { type: 'null' }] }],
  ])('is true for a flagged $defs entry reached through %s', (_, node) => {
    expect(isExperimental(flaggedDef, node)).toBe(true);
  });

  it('is true for a flagged $defs entry reached through an unflagged wrapper entry', () => {
    const wrapped = {
      $defs: {
        ...flaggedDef.$defs,
        Resolvers: { items: ref, type: 'array' },
        MaybeResolvers: { anyOf: [{ $ref: '#/$defs/Resolvers' }, { type: 'null' }] },
      },
    };
    expect(isExperimental(wrapped, { $ref: '#/$defs/Resolvers' })).toBe(true);
    expect(isExperimental(wrapped, { items: { $ref: '#/$defs/MaybeResolvers' } })).toBe(true);
  });

  it('terminates on $defs entries that refer to each other', () => {
    const cyclic = {
      $defs: {
        Condition: { anyOf: [{ type: 'string' }, { items: { $ref: '#/$defs/Conditions' } }] },
        Conditions: { items: { $ref: '#/$defs/Condition' }, type: 'array' },
      },
    };
    expect(isExperimental(cyclic, { $ref: '#/$defs/Conditions' })).toBe(false);
  });

  it('is false once the flag is gone, with no other change', () => {
    expect(isExperimental(publicDef, { items: ref, type: 'array' })).toBe(false);
    expect(isExperimental({}, { type: 'boolean', 'x-mergify-experimental': false })).toBe(false);
  });

  it('does not look inside a node’s own properties', () => {
    const node = { properties: { inner: { 'x-mergify-experimental': true } }, type: 'object' };
    expect(isExperimental({}, node)).toBe(false);
  });

  it('is false for a dangling $ref', () => {
    expect(isExperimental({}, ref)).toBe(false);
  });
});

describe('documentedEntries', () => {
  it('keeps the public properties and drops the experimental ones', () => {
    const keys = documentedEntries(schema, schema.$defs.QueueRuleModel.properties).map(
      ([key]) => key
    );
    expect(keys).toEqual(['name']);
  });

  it('accepts a missing properties map', () => {
    expect(documentedEntries(schema, undefined)).toEqual([]);
  });
});

describe('schema-driven tables skip experimental options', () => {
  it('OptionsTableBase renders no row for them', () => {
    const html = renderToStaticMarkup(
      OptionsTableBase(schema, schema.$defs.QueueRuleModel.properties as never, 'QueueRuleModel')
    );
    expect(html).toContain('queue-rule-model-name');
    expect(html).not.toContain('preview_mode');
    expect(html).not.toContain('resolvers');
  });

  it('getValueType leaves them out of an inline object shape', () => {
    const html = renderToStaticMarkup(
      getValueType(schema, { properties: schema.$defs.QueueRuleModel.properties, type: 'object' })!
    );
    expect(html).toContain('{name}');
  });

  it('PullRequestAttributes renders no entry for them', () => {
    const html = renderToStaticMarkup(<PullRequestAttributes />);
    expect(html).toContain('pull-request-attributes-author');
    expect(html).not.toContain('preview-state');
  });

  it('the markdown export leaves them out of options and attributes tables', () => {
    const options = expandMdxComponents('<OptionsTable def="QueueRuleModel" />');
    expect(options).toContain('`name`');
    expect(options).not.toContain('preview_mode');
    expect(options).not.toContain('resolvers');

    const attributes = expandMdxComponents('<PullRequestAttributesTable />');
    expect(attributes).toContain('`author`');
    expect(attributes).not.toContain('preview-state');
  });
});
