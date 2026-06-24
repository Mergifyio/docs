import * as yaml from 'js-yaml';

import configSchema from '../../util/sanitizedConfigSchema';
import { extractTemplateVariables } from '../../util/templateVariables';
import Badge from '../Badge/Badge';
import {
  ConfigSchema,
  Def,
  getValueType,
  OptionDefinition,
  OptionDefinitionProperties,
} from './ConfigOptions';
import styles from './OptionsTable.module.css';
import { renderMarkdown } from './utils';

export default function OptionsTable({ def }: Def) {
  const options = (configSchema as unknown as ConfigSchema).$defs[def].properties;
  return OptionsTableBase(configSchema, options, def);
}

function defToIdPrefix(def: string): string {
  return def.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function dumpDefault(value: unknown): string {
  return yaml
    .dump(value, {
      noCompatMode: true,
      lineWidth: -1,
      quotingType: '"',
      noRefs: true,
    })
    .replace(/\n$/, '');
}

export function OptionsTableBase(
  schema: object,
  options: OptionDefinitionProperties,
  def?: string
) {
  const idPrefix = def ? `${defToIdPrefix(def)}-` : '';
  return (
    <div className={styles.list}>
      {Object.entries(options)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([optionKey, definition]) => {
          const valueType = getValueType(schema, definition);
          const hasDefault = (definition as OptionDefinition).default !== undefined;
          const defaultDump = hasDefault
            ? dumpDefault((definition as OptionDefinition).default)
            : '';
          const defaultIsMultiline = hasDefault && defaultDump.includes('\n');
          const isDeprecated = Boolean(definition.deprecated);
          // A simple-template field's description carries an "Allowed variables: …"
          // list. Once the schema publishes x-mergify-template-variables, the data
          // type renders a richer <TemplateVariablesTable>, so the duplicate list is
          // stripped here. Until that annotation is synced in, keep the list — it is
          // the only variable reference readers have.
          const rawDescription = (definition as OptionDefinition).description;
          const hasPublishedVariables =
            definition.format === 'simple-template' &&
            extractTemplateVariables(definition).length > 0;
          const description =
            hasPublishedVariables && typeof rawDescription === 'string'
              ? rawDescription.replace(/\s*Allowed variables:.*$/s, '').trim()
              : rawDescription;
          const id = `${idPrefix}${optionKey}`;
          const href = `#${encodeURIComponent(id)}`;

          const optionClass = isDeprecated
            ? `${styles.option} ${styles.deprecated}`
            : styles.option;

          return (
            <div key={optionKey} id={id} className={optionClass}>
              <div className={styles.heading}>
                <code className={styles.key}>{optionKey}</code>
                <a className={styles.anchor} href={href} aria-label={`Link to ${optionKey}`}>
                  #
                </a>
                <span className={styles.meta}>
                  {valueType}
                  {hasDefault && (
                    <>
                      <span className={styles.metaSeparator}>·</span>
                      <span className={styles.metaLabel}>default</span>
                      {!defaultIsMultiline && <code>{defaultDump}</code>}
                    </>
                  )}
                  {isDeprecated && (
                    <>
                      <span className={styles.metaSeparator}>·</span>
                      <Badge>deprecated</Badge>
                    </>
                  )}
                </span>
              </div>
              {defaultIsMultiline && (
                <pre className={styles.defaultBlock}>
                  <code>{defaultDump}</code>
                </pre>
              )}
              {description !== undefined && (
                <div
                  className={styles.description}
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(description),
                  }}
                />
              )}
            </div>
          );
        })}
    </div>
  );
}
