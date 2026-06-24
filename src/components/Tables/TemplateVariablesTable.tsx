import configSchema from '../../util/sanitizedConfigSchema';
import { extractTemplateVariables } from '../../util/templateVariables';

import { ConfigSchema, Def } from './ConfigOptions';
import { renderMarkdown } from './utils';

interface TemplateVariablesTableProps extends Def {
  field: string;
}

export default function TemplateVariablesTable({ def, field }: TemplateVariablesTableProps) {
  const schema = configSchema as unknown as ConfigSchema;
  const definition = schema.$defs[def]?.properties?.[field];
  const variables = extractTemplateVariables(definition);

  // Astro's React SSR rejects a component that conditionally returns null/undefined,
  // so render an empty fragment (not null) when the field has no published variables
  // — the graceful state before the engine schema with x-mergify-template-variables
  // is synced into the docs.
  if (variables.length === 0) {
    return <></>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Variable</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {variables.map((variable) => (
            <tr key={variable.name}>
              <td>
                <code>{`{{ ${variable.name} }}`}</code>
              </td>
              <td dangerouslySetInnerHTML={{ __html: renderMarkdown(variable.description) }} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
