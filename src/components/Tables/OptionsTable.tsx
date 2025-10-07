import * as yaml from 'js-yaml';

import configSchema from '../../util/sanitizedConfigSchema';
import Badge from '../Badge/Badge';
import {
  ConfigSchema,
  Def,
  getValueType,
  OptionDefinition,
  OptionDefinitionProperties,
} from './ConfigOptions';
import { renderMarkdown } from './utils';

export default function OptionsTable({ def }: Def) {
  const options = (configSchema as unknown as ConfigSchema).$defs[def].properties;
  return OptionsTableBase(configSchema, options);
}

export function OptionsTableBase(schema: object, options: OptionDefinitionProperties) {
  const hasDefaultValue = (definition: OptionDefinition) => definition.default !== undefined;

  const shouldHideDefaultColumn = Object.entries(options).every(
    ([, definition]) => !definition.default
  );
  const shouldHideDeprecatedColumn = Object.entries(options).every(
    ([, definition]) => !definition.deprecated
  );

  return (
    <table>
      <thead>
        <tr>
          <th>Key name</th>
          <th>Value type</th>
          {!shouldHideDefaultColumn && <th>Default</th>}
          {!shouldHideDeprecatedColumn && <th />}
        </tr>
      </thead>
      <tbody>
        {Object.entries(options)
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
          .map(([optionKey, definition]) => {
            const valueType = getValueType(schema, definition);

            const { deprecated } = definition;

            return (
              <>
                <tr style={{ position: 'relative' }}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <code>{optionKey}</code>
                  </td>
                  <td>{valueType}</td>
                  {!shouldHideDefaultColumn && (
                    <td>
                      {hasDefaultValue(definition) && (
                        <pre style={{ whiteSpace: 'pre-wrap' }}>
                          <code
                            dangerouslySetInnerHTML={{
                              __html: yaml.dump(definition.default, {
                                noCompatMode: true,
                                lineWidth: -1,
                                quotingType: '"',
                                noRefs: true,
                              }),
                            }}
                          />
                        </pre>
                      )}
                    </td>
                  )}
                  {!shouldHideDeprecatedColumn && (
                    <td>{deprecated && <Badge>deprecated</Badge>}</td>
                  )}
                </tr>
                {definition.description !== undefined && (
                  <tr>
                    {/* FIXME: don't hardcode the border color like that */}
                    <td {...({ colSpan: shouldHideDefaultColumn ? '3' : '4' } as any)}>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: renderMarkdown(definition.description),
                        }}
                      />
                    </td>
                  </tr>
                )}
              </>
            );
          })}
      </tbody>
    </table>
  );
}
