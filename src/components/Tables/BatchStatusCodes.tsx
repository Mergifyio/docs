import apiSchema from '../../../public/api-schemas.json';

import { renderMarkdown } from './utils';

// A batch's `status.code` in the merge queue API. The engine is the single
// source of truth: the codes come from the property's enum, and a one-line
// description for each is published alongside it under `x-enum-descriptions`
// (keyed by the raw code), so this table can't drift from what the API
// returns. Same convention as the queue dequeue reason table, sourced from the
// OpenAPI spec rather than the configuration schema because a batch status is
// something the API reports, never something you write in `.mergify.yml`.
//
// The lookup is optional-chained through a loose cast so a future schema
// reshape (renamed model or property) degrades to an empty table rather than
// throwing at module load and crashing the Astro build.
const codeProp: unknown = (
  apiSchema as {
    components?: { schemas?: Record<string, { properties?: Record<string, unknown> }> };
  }
).components?.schemas?.BatchStatus?.properties?.code;

export default function BatchStatusCodes() {
  const node = codeProp as
    | { enum?: string[]; 'x-enum-descriptions'?: Record<string, string> }
    | undefined;
  const descriptions = node?.['x-enum-descriptions'] ?? {};

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {(node?.enum ?? []).map((code) => (
            <tr key={code}>
              <td>
                <code>{code}</code>
              </td>
              <td dangerouslySetInnerHTML={{ __html: renderMarkdown(descriptions[code] ?? '') }} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
