import jsonpointer from 'jsonpointer';

import configSchema from './sanitizedConfigSchema';

type Schema = typeof configSchema;

function getItemFromSchema(schema: Schema, path: string) {
  const refPath = path.replace('#', '');
  return jsonpointer.get(schema, refPath);
}

function getTitle(schema: Schema, ref: string): string {
  const item = getItemFromSchema(schema, ref);
  return item?.title || item?.name || '';
}

/**
 * Plain-text equivalent of ConfigOptions.getValueType — returns a markdown
 * string instead of a React element.
 */
function getValueTypeText(schema: Schema, definition: any): string {
  if (definition.type === 'array') {
    if (definition.items?.$ref) {
      return `list of ${getTitle(schema, definition.items.$ref)}`;
    }
    return `list of ${getValueTypeText(schema, definition.items)}`;
  }

  if (definition.$ref !== undefined) {
    return getTitle(schema, definition.$ref);
  }

  if (definition.anyOf || definition.oneOf || definition.allOf) {
    const defs: any[] = definition.anyOf || definition.oneOf || definition.allOf;
    return defs.map((item) => getValueTypeText(schema, item)).join(' or ');
  }

  if (definition.enum) {
    return definition.enum.map((item: string) => `\`${item}\``).join(' or ');
  }

  if (definition.const !== undefined) {
    return `\`${definition.const}\``;
  }

  if (definition.format) {
    return definition.format;
  }

  return definition.type || '';
}

function escapeCell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function formatDefault(value: unknown): string {
  if (value === null) return '`null`';
  if (typeof value === 'boolean') return `\`${value}\``;
  if (typeof value === 'string') return `\`"${value}"\``;
  return `\`${JSON.stringify(value)}\``;
}

function generateOptionsTable(defName: string): string {
  const def = (configSchema as any).$defs[defName];
  if (!def?.properties) return '';

  const entries = Object.entries<any>(def.properties).sort(([a], [b]) => a.localeCompare(b));

  const hasDefault = entries.some(([, d]) => d.default !== undefined);
  const hasDeprecated = entries.some(([, d]) => d.deprecated);

  const headers = ['Key name', 'Value type'];
  if (hasDefault) headers.push('Default');
  headers.push('Description');
  if (hasDeprecated) headers.push('Status');

  const rows: string[][] = [];
  for (const [key, definition] of entries) {
    const row = [`\`${key}\``, escapeCell(getValueTypeText(configSchema, definition))];

    if (hasDefault) {
      row.push(definition.default !== undefined ? formatDefault(definition.default) : '');
    }

    row.push(definition.description ? escapeCell(definition.description) : '');

    if (hasDeprecated) {
      row.push(definition.deprecated ? 'deprecated' : '');
    }

    rows.push(row);
  }

  const headerLine = '| ' + headers.join(' | ') + ' |';
  const separatorLine = '| ' + headers.map(() => '---').join(' | ') + ' |';
  const rowLines = rows.map((row) => '| ' + row.join(' | ') + ' |');

  return [headerLine, separatorLine, ...rowLines].join('\n');
}

function generatePullRequestAttributesTable(): string {
  const attributes = (configSchema as any).$defs.PullRequestAttributes.properties;
  const entries = Object.entries<any>(attributes).sort(([a], [b]) => a.localeCompare(b));

  const rows: string[][] = [];
  for (const [key, value] of entries) {
    rows.push([
      `\`${key}\``,
      escapeCell(getValueTypeText(configSchema, value)),
      value.description ? escapeCell(value.description) : '',
    ]);
  }

  const headerLine = '| Attribute name | Value type | Description |';
  const separatorLine = '| --- | --- | --- |';
  const rowLines = rows.map((row) => '| ' + row.join(' | ') + ' |');

  return [headerLine, separatorLine, ...rowLines].join('\n');
}

/**
 * Strip top-level MDX/ESM import lines while preserving imports inside
 * fenced code blocks and frontmatter.
 */
function stripTopLevelImports(source: string): string {
  const lines = source.split('\n');
  const output: string[] = [];
  const startsWithFrontmatter = lines[0]?.trim() === '---';

  let inFrontmatter = startsWithFrontmatter;
  let inFence = false;
  let fenceChar = '';
  let fenceLen = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (inFrontmatter) {
      output.push(line);
      if (i > 0 && trimmed === '---') inFrontmatter = false;
      continue;
    }

    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const fence = fenceMatch[1];
      if (!inFence) {
        inFence = true;
        fenceChar = fence[0];
        fenceLen = fence.length;
      } else if (fence[0] === fenceChar && fence.length >= fenceLen) {
        inFence = false;
      }
      output.push(line);
      continue;
    }

    if (!inFence && /^\s*import\s+.+$/.test(line)) continue;

    output.push(line);
  }

  return output.join('\n');
}

/**
 * Process raw MDX source for LLM consumption: replace custom JSX
 * components with markdown equivalents and remove import statements.
 */
export function expandMdxComponents(source: string): string {
  // Remove top-level import lines (components, images, astro:assets, etc.)
  source = stripTopLevelImports(source);

  // Replace <OptionsTable def="..." /> and <ActionOptionsTable def="..." />
  source = source.replace(/<(?:Options|ActionOptions)Table\s+def=["'](\w+)["']\s*\/?>/g, (_, def) =>
    generateOptionsTable(def)
  );

  // Replace <PullRequestAttributesTable />
  source = source.replace(/<PullRequestAttributesTable\s*\/?>/g, () =>
    generatePullRequestAttributesTable()
  );

  // Collapse runs of 3+ blank lines to 2
  source = source.replace(/\n{3,}/g, '\n\n');

  return source;
}
