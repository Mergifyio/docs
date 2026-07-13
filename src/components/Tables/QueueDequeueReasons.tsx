import configSchema from '../../util/sanitizedConfigSchema';

import { renderMarkdown } from './utils';

// The `queue-dequeue-reason` condition attribute accepts one of the merge queue
// dequeue codes. The engine is the single source of truth: the codes come from
// the attribute's enum, and a one-line description for each is published
// alongside it under `x-enum-descriptions` (keyed by the raw code). Driving the
// code list from the enum keeps the table current even before a schema sync
// delivers the descriptions.
//
// `x-enum-descriptions` is not in the synced schema until the engine ships it,
// so it is absent from the JSON-derived types and read via a cast (it becomes a
// normal typed key once the sync bot lands it).
//
// The lookup is optional-chained through a loose cast so a future schema reshape
// (renamed attribute or restructured `$defs`) degrades to an empty table rather
// than throwing at module load and crashing the Astro build.
const reasonProp: unknown = (
  configSchema as {
    $defs?: { PullRequestAttributes?: { properties?: Record<string, unknown> } };
  }
).$defs?.PullRequestAttributes?.properties?.['queue-dequeue-reason'];

type EnumNode = { anyOf?: EnumNode[]; enum?: string[]; const?: string };

function branchValues(node: EnumNode): string[] {
  if (node.const !== undefined) {
    return [node.const];
  }
  return node.enum ?? [];
}

// Collect the raw enum values the attribute accepts, tolerating the shapes the
// engine might emit: an `anyOf` of `{const}` / `{enum}` branches (today), or a
// flat `{enum}` / `{const}`. Returns [] for anything else (or a missing node),
// so a future schema-shape change degrades to an empty table rather than
// crashing the Astro build.
function enumValues(prop: unknown): string[] {
  if (!prop || typeof prop !== 'object') {
    return [];
  }
  const node = prop as EnumNode;
  return node.anyOf ? node.anyOf.flatMap(branchValues) : branchValues(node);
}

// The engine stores codes as `UPPER_SNAKE`; conditions are written in kebab-case
// (the parser normalizes `upper().replace('-', '_')`), so that is what to show.
function toKebab(code: string): string {
  return code.toLowerCase().replace(/_/g, '-');
}

export default function QueueDequeueReasons() {
  const descriptions =
    (reasonProp as { 'x-enum-descriptions'?: Record<string, string> } | undefined)?.[
      'x-enum-descriptions'
    ] ?? {};

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
          {enumValues(reasonProp).map((code) => (
            <tr key={code}>
              <td>
                <code>{toKebab(code)}</code>
              </td>
              <td dangerouslySetInnerHTML={{ __html: renderMarkdown(descriptions[code] ?? '') }} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
