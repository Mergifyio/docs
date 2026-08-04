import { readEnumChoices } from '../../util/enumChoices';
import configSchema from '../../util/sanitizedConfigSchema';

import { renderMarkdown } from './utils';

// The `queue-dequeue-reason` condition attribute accepts one of the merge queue
// dequeue codes. The engine is the single source of truth: the codes and their
// one-line descriptions are published on the attribute itself, so this table
// stays current without being hand-maintained.
//
// `readEnumChoices` handles every shape the engine can publish here — a flat
// `enum`, the `anyOf` of `const`/`enum` branches a composed `Literal` produces
// today, or a `$ref` to a shared component — and reads the documentation from
// either `x-mergify-enum` or the older `x-enum-descriptions` map.
//
// The lookup is optional-chained through a loose cast so a future schema reshape
// (renamed attribute or restructured `$defs`) degrades to an empty table rather
// than throwing at module load and crashing the Astro build.
const reasonProp: unknown = (
  configSchema as {
    $defs?: { PullRequestAttributes?: { properties?: Record<string, unknown> } };
  }
).$defs?.PullRequestAttributes?.properties?.['queue-dequeue-reason'];

// The engine stores codes as `UPPER_SNAKE`; conditions are written in kebab-case
// (the parser normalizes `upper().replace('-', '_')`), so that is what to show.
function toKebab(code: string): string {
  return code.toLowerCase().replace(/_/g, '-');
}

export default function QueueDequeueReasons() {
  const choices = readEnumChoices(configSchema, reasonProp);

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Reason</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {choices.map((choice) => (
            <tr key={choice.value}>
              <td>
                <code>{toKebab(choice.value)}</code>
              </td>
              <td dangerouslySetInnerHTML={{ __html: renderMarkdown(choice.description) }} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
