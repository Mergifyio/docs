import { getAttributeSource } from '../../util/attributeMetadata';
import configSchema from '../../util/sanitizedConfigSchema';
import { getValueType } from './ConfigOptions';

import { renderMarkdown } from './utils';

type Attributes = typeof configSchema.$defs.PullRequestAttributes.properties;

interface Props {
  staticAttributes?: Attributes;
  // When set, render only attributes whose metadata source matches (e.g. "github").
  // When unset, render only attributes that have no source (config-writable ones).
  source?: string;
}

export default function PullRequestAttributes({ staticAttributes, source }: Props) {
  // The search-highlight path passes a pre-filtered subset; render it as-is.
  // Otherwise partition the canonical list by metadata source.
  const attributes =
    staticAttributes ??
    (Object.fromEntries(
      Object.entries(configSchema.$defs.PullRequestAttributes.properties).filter(([, value]) => {
        const attributeSource = getAttributeSource(value);
        return source ? attributeSource === source : attributeSource === undefined;
      })
    ) as Attributes);

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Attribute name</th>
            <th>Value type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(attributes)
            .sort(([keyA, _valueA], [keyB, _valueB]) => (keyA > keyB ? 1 : -1))
            .map(([key, value]) => {
              const valueType = getValueType(configSchema, value);

              return (
                <tr key={key}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <code>{key}</code>
                  </td>
                  <td>{valueType}</td>
                  <td
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(value.description) }}
                    style={{ width: '100%' }}
                  />
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
