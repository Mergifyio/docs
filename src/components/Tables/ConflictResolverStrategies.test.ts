import { describe, expect, it } from 'vitest';
import configSchema from '../../../public/mergify-configuration-schema.json';
import { readEnumChoices } from '../../util/enumChoices';
import { KNOWN_VOCABULARY, strategyRows } from './ConflictResolverStrategies';

// The table renders whatever the synced schema publishes and never throws, so a
// sync that drops the facts, or brings a strategy this table cannot word, would
// otherwise reach the page as blank or raw cells. Schema syncs land on main
// without a pull request, so this check runs on the next one instead.
const strategy = (
  configSchema as {
    $defs: { ConflictResolverModel: { properties: { strategy: unknown } } };
  }
).$defs.ConflictResolverModel.properties.strategy;

const choices = readEnumChoices(configSchema, strategy);

describe('conflict resolver strategies in the synced schema', () => {
  it('documents every strategy with a description and facts', () => {
    expect(choices.length).toBeGreaterThan(0);
    expect(choices.filter((c) => c.description.trim() === '' || !c.facts)).toEqual([]);
  });

  it('fills every cell of the table', () => {
    for (const row of strategyRows(choices)) {
      expect(row.discards, row.value).not.toBe('');
      expect(row.binary, row.value).not.toBe('');
    }
  });

  it('publishes only vocabulary the table has wording for', () => {
    for (const choice of choices) {
      const facts = choice.facts ?? {};
      const lost = facts.discards as { side?: string; scope?: string } | null;
      if (lost !== null) {
        expect(KNOWN_VOCABULARY.sides, choice.value).toContain(lost.side);
        expect(KNOWN_VOCABULARY.scopes, choice.value).toContain(lost.scope);
      }
      for (const value of (facts.suits as string[]) ?? []) {
        expect(KNOWN_VOCABULARY.suits, choice.value).toContain(value);
      }
    }
  });

  it('publishes no options yet, since the table has no column for them', () => {
    for (const choice of choices) {
      expect(choice.facts?.options, choice.value).toEqual({});
    }
  });
});

describe('strategyRows', () => {
  it('words a strategy that discards nothing', () => {
    expect(
      strategyRows([
        {
          value: 'union',
          description: 'Keep both.',
          deprecated: false,
          facts: { discards: null, resolves_binary: false, suits: ['append-only'] },
        },
      ])
    ).toEqual([
      {
        value: 'union',
        description: 'Keep both. Suited to append-only files, such as a changelog.',
        discards: 'Nothing',
        binary: 'No',
      },
    ]);
  });

  it('words what a strategy discards, and passes unknown values through', () => {
    const [known, unknown] = strategyRows([
      {
        value: 'prefer-ours',
        description: '',
        deprecated: false,
        facts: {
          discards: { side: 'theirs', scope: 'conflicting-lines' },
          resolves_binary: true,
          suits: [],
        },
      },
      {
        value: 'later',
        description: '',
        deprecated: false,
        facts: { discards: { side: 'both', scope: 'hunk' }, suits: ['json'] },
      },
    ]);
    expect(known.discards).toBe("The incoming pull request's side of the conflicting lines");
    expect(known.binary).toBe('Yes');
    expect(unknown.discards).toBe('both hunk');
    expect(unknown.description).toBe('Suited to json.');
    expect(unknown.binary).toBe('');
  });

  it('leaves the cells empty for a schema without facts', () => {
    expect(
      strategyRows([{ value: 'union', description: 'Keep both.', deprecated: false }])
    ).toEqual([{ value: 'union', description: 'Keep both.', discards: '', binary: '' }]);
  });
});
