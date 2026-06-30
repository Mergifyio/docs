import configSchema from '../../util/sanitizedConfigSchema';
import { getValueType } from './ConfigOptions';

import { renderMarkdown } from './utils';

// The engine annotates each condition attribute with its authoritative operators
// and modifiers (`x-allowed-operators` / `x-modifiers`). The generated TypeScript
// types drop `x-` keys, so they are read from the imported JSON via this shape.
interface ConditionMeta {
  'x-allowed-operators'?: string[];
  'x-modifiers'?: {
    negate: 'forbidden' | 'optional';
    length: 'forbidden' | 'optional' | 'required';
  };
}

interface Props {
  staticAttributes: typeof configSchema.$defs.PullRequestAttributes.properties;
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
  if (modifiers.negate === 'optional') {
    parts.push(<code key="negate">-</code>);
  }
  if (modifiers.length === 'optional') {
    parts.push(<code key="length">#</code>);
  } else if (modifiers.length === 'required') {
    parts.push(
      <span key="length" style={{ whiteSpace: 'nowrap' }}>
        <code>#</code> (required)
      </span>
    );
  }

  if (parts.length === 0) {
    return <span>—</span>;
  }

  return parts.flatMap((part, index) => (index === 0 ? [part] : [' ', part]));
}

export default function PullRequestAttributes({ staticAttributes }: Props) {
  const attributes = staticAttributes ?? configSchema.$defs.PullRequestAttributes.properties;

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

            return (
              <tr key={key}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <code>{key}</code>
                </td>
                <td>{valueType}</td>
                {hasConditionMetadata && (
                  <td>{renderOperators(meta['x-allowed-operators'] ?? [])}</td>
                )}
                {hasConditionMetadata && <td>{renderModifiers(meta['x-modifiers'])}</td>}
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
