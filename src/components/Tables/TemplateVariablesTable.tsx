import configSchema from '../../util/sanitizedConfigSchema';
import { extractTemplateVariables } from '../../util/templateVariables';

import { ConfigSchema, Def } from './ConfigOptions';
import { renderMarkdown } from './utils';

interface TemplateVariablesTableProps extends Def {
  field: string;
}

// A template variable whose value is drawn from an enumerated data type carries a
// `type` token in the schema (`x-mergify-template-variables[].type`). Map that token
// to the data type section listing the accepted values, mirroring how option value
// types link to their data type (see ConfigOptions `valueTypeFormatLinks`). Keying
// off the schema-published token means a new typed variable needs only its engine
// annotation plus one entry here — no per-variable-name special-casing.
const variableTypeLinks: Record<string, string> = {
  'queue-dequeue-reason': '/configuration/data-types#queue-dequeue-reason',
};

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
          {variables.map((variable) => {
            const typeLink = variable.type ? variableTypeLinks[variable.type] : undefined;
            return (
              <tr key={variable.name}>
                <td>
                  {typeLink !== undefined ? (
                    <a style={{ textDecoration: 'underline' }} href={typeLink}>
                      <code>{`{{ ${variable.name} }}`}</code>
                    </a>
                  ) : (
                    <code>{`{{ ${variable.name} }}`}</code>
                  )}
                </td>
                <td dangerouslySetInnerHTML={{ __html: renderMarkdown(variable.description) }} />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
