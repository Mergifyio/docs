import { getAttributeDocumentationUrl, getAttributeSource } from '../../util/attributeMetadata';
import configSchema from '../../util/sanitizedConfigSchema';
import { getValueType } from './ConfigOptions';
import { defToIdPrefix } from './OptionsTable';
import styles from './PullRequestAttributes.module.css';

import { renderMarkdown } from './utils';

type Attributes = typeof configSchema.$defs.PullRequestAttributes.properties;

// The engine annotates each condition attribute with its authoritative operators
// and modifiers (`x-allowed-operators` / `x-modifiers`). The generated TypeScript
// types drop `x-` keys, so they are read from the imported JSON via this shape.
// `x-modifiers` is a forbidden-by-default list: a modifier appears iff it is
// available, and each object carries only the fields that modifier needs.
type ConditionModifier = { type: 'negate' } | { type: 'length'; required?: boolean };

interface ConditionMeta {
  'x-allowed-operators'?: string[];
  'x-modifiers'?: ConditionModifier[];
}

// Mirror the config-option anchor scheme: `<def>-<key>`, e.g.
// `pull-request-attributes-author`.
const ID_PREFIX = defToIdPrefix('PullRequestAttributes');

interface Props {
  staticAttributes?: Attributes;
  // When set, render only attributes whose metadata source matches (e.g. "github").
  // When unset, render only attributes that have no source (config-writable ones).
  source?: string;
}

function renderOperators(operators: string[]) {
  if (operators.length === 0) {
    // Boolean attributes take no operator: used on their own or negated with `-`.
    return <span title="No operator — used on its own or negated">—</span>;
  }

  return operators.flatMap((operator, index) => {
    const chip = (
      <code key={operator} style={{ whiteSpace: 'nowrap' }}>
        {operator}
      </code>
    );
    return index === 0 ? [chip] : [' ', chip];
  });
}

function renderModifiers(modifiers: ConditionMeta['x-modifiers']) {
  if (!modifiers) {
    return <span>—</span>;
  }

  const parts: React.ReactNode[] = [];
  if (modifiers.some((modifier) => modifier.type === 'negate')) {
    parts.push(<code key="negate">-</code>);
  }
  const lengthModifier = modifiers.find(
    (modifier): modifier is Extract<ConditionModifier, { type: 'length' }> =>
      modifier.type === 'length'
  );
  if (lengthModifier?.required) {
    parts.push(
      <span key="length" style={{ whiteSpace: 'nowrap' }}>
        <code>#</code> (required)
      </span>
    );
  } else if (lengthModifier) {
    parts.push(<code key="length">#</code>);
  }

  if (parts.length === 0) {
    return <span>—</span>;
  }

  return parts.flatMap((part, index) => (index === 0 ? [part] : [' ', part]));
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

  const entries = Object.entries(attributes).sort(([keyA], [keyB]) => (keyA > keyB ? 1 : -1));

  // Only render the operator/modifier columns once the schema carries the
  // metadata. Until then (or if a sync drops it), fall back to the bare table.
  const hasConditionMetadata = entries.some(([, value]) =>
    Array.isArray((value as ConditionMeta)['x-allowed-operators'])
  );

  // Attributes without `x-allowed-operators` (e.g. `check`, `co-authors`) are not
  // valid condition operands, so drop them once the metadata is available.
  const rows = hasConditionMetadata
    ? entries.filter(([, value]) => Array.isArray((value as ConditionMeta)['x-allowed-operators']))
    : entries;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Attribute name</th>
            <th>Value type</th>
            {hasConditionMetadata && <th>Operators</th>}
            {hasConditionMetadata && <th>Modifiers</th>}
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([key, value]) => {
            const valueType = getValueType(configSchema, value);
            const meta = value as ConditionMeta;
            const id = `${ID_PREFIX}-${key}`;
            const href = `#${encodeURIComponent(id)}`;
            // The search-highlight path injects <em> markers into attribute
            // values, which would corrupt the URL — only link from the
            // canonical schema render.
            const documentationUrl = staticAttributes
              ? undefined
              : getAttributeDocumentationUrl(value);

            return (
              <tr key={key} id={id} className={styles.row}>
                <td className={styles.name}>
                  <code>{key}</code>
                  <a className={styles.anchor} href={href} aria-label={`Link to ${key}`}>
                    #
                  </a>
                </td>
                <td>{valueType}</td>
                {hasConditionMetadata && (
                  <td>{renderOperators(meta['x-allowed-operators'] ?? [])}</td>
                )}
                {hasConditionMetadata && <td>{renderModifiers(meta['x-modifiers'])}</td>}
                <td style={{ width: '100%' }}>
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(value.description) }} />
                  {documentationUrl && (
                    <p className={styles.documentationLink}>
                      <a
                        href={documentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`GitHub documentation for ${key}`}
                      >
                        GitHub documentation
                      </a>
                    </p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
