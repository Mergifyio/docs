import apiSchema from '../../../public/api-schemas.json';
import { readEnumChoices } from '../../util/enumChoices';

import { renderMarkdown } from './utils';

// A batch's `status.code` in the merge queue API. The engine is the single
// source of truth: the codes and their one-line descriptions are published
// alongside the schema, so this table can't drift from what the API returns.
// Sourced from the OpenAPI spec rather than the configuration schema because a
// batch status is something the API reports, never something you write in
// `.mergify.yml`.
//
// `readEnumChoices` resolves a `$ref` and understands every documentation
// shape the engine currently publishes, so this keeps rendering whether the
// property is inline or hoisted into a shared component.
const codeProp: unknown = (
  apiSchema as {
    components?: { schemas?: Record<string, { properties?: Record<string, unknown> }> };
  }
).components?.schemas?.BatchStatus?.properties?.code;

export default function BatchStatusCodes() {
  const choices = readEnumChoices(apiSchema, codeProp);

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
          {choices.map((choice) => (
            <tr key={choice.value}>
              <td>
                <code>{choice.value}</code>
              </td>
              <td dangerouslySetInnerHTML={{ __html: renderMarkdown(choice.description) }} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
