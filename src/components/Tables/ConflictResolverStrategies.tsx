import configSchema from '../../../public/mergify-configuration-schema.json';
import { type EnumChoice, readEnumChoices } from '../../util/enumChoices';

import { renderMarkdown } from './utils';

// The strategies a `conflict_resolvers` entry accepts, and what each one does to
// a conflicting file. The engine publishes them on the `strategy` field as
// `x-mergify-enum` entries carrying a one-line description plus structured
// `facts`, generated from the same definitions that run the merge. Rendering
// from them means a new strategy reaches this page with the next schema sync,
// with no one editing it.
//
// Not rendered: `kind` (whether git or a Mergify driver performs the merge does
// not change the result a reader sees) and `options` (no strategy takes any
// yet). `ConflictResolverStrategies.test.ts` fails when a strategy publishes options or a
// vocabulary value this table has no wording for, so neither can arrive here
// unrendered.
const strategyProp: unknown = (
  configSchema as {
    $defs?: { ConflictResolverModel?: { properties?: Record<string, unknown> } };
  }
).$defs?.ConflictResolverModel?.properties?.strategy;

// The engine's `ours` is the batch as it stands and `theirs` the pull request
// being added to it; the page uses the same words as the descriptions.
const SIDES: Record<string, string> = {
  ours: "The batch's",
  theirs: "The incoming pull request's",
};

const SCOPES: Record<string, string> = {
  'whole-file': 'whole file',
  'conflicting-lines': 'side of the conflicting lines',
};

const SUITS: Record<string, string> = {
  'append-only': 'append-only files, such as a changelog',
};

export const KNOWN_VOCABULARY = {
  sides: Object.keys(SIDES),
  scopes: Object.keys(SCOPES),
  suits: Object.keys(SUITS),
};

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function discards(facts: Record<string, unknown> | undefined): string {
  if (!facts) {
    return '';
  }
  const lost = facts.discards;
  if (lost === null) {
    return 'Nothing';
  }
  if (!isObject(lost)) {
    return '';
  }
  const side = String(lost.side);
  const scope = String(lost.scope);
  return `${SIDES[side] ?? side} ${SCOPES[scope] ?? scope}`;
}

function binary(facts: Record<string, unknown> | undefined): string {
  if (typeof facts?.resolves_binary !== 'boolean') {
    return '';
  }
  return facts.resolves_binary ? 'Yes' : 'No';
}

function suits(facts: Record<string, unknown> | undefined): string {
  const values = Array.isArray(facts?.suits) ? facts.suits.map(String) : [];
  if (values.length === 0) {
    return '';
  }
  return `Suited to ${values.map((value) => SUITS[value] ?? value).join('; ')}.`;
}

export function strategyRows(choices: EnumChoice[]) {
  return choices.map((choice) => ({
    value: choice.value,
    description: [choice.description, suits(choice.facts)].filter(Boolean).join(' '),
    discards: discards(choice.facts),
    binary: binary(choice.facts),
  }));
}

export default function ConflictResolverStrategies() {
  const rows = strategyRows(readEnumChoices(configSchema, strategyProp));

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Strategy</th>
            <th>What it does</th>
            <th>What it discards</th>
            <th>Resolves binary files</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.value}>
              <td>
                <code>{row.value}</code>
              </td>
              <td dangerouslySetInnerHTML={{ __html: renderMarkdown(row.description) }} />
              <td>{row.discards}</td>
              <td>{row.binary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
