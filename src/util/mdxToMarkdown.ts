import * as yaml from 'js-yaml';
import jsonpointer from 'jsonpointer';
import configSchema from './sanitizedConfigSchema';

// ── Schema helpers ──────────────────────────────────────────────────────────

const valueTypeLinks: Record<string, string> = {
  Commit: '/configuration/data-types#commit',
  CommitAuthor: '/configuration/data-types#commit-author',
  ListOfRuleConditions: '/configuration/conditions',
  CommandRestrictionsConditionsModel: '/configuration/conditions',
  PullRequestRuleConditionsModel: '/configuration/conditions',
  QueueRuleMergeConditionsModel: '/configuration/conditions',
  PriorityRuleConditionsModel: '/configuration/conditions',
  GhaActionModelWorkflow: '/workflow/actions/github_actions#workflow-action',
  GhaActionModelDispatch: '/workflow/actions/github_actions#workflow-action-dispatch',
  CommandRestrictionsModel: '/commands/restrictions#command-restriction-format',
  GitHubRepositoryPermission: '/configuration/data-types#github-repository-permissions',
};

const valueTypeFormatLinks: Record<string, string> = {
  template: '/configuration/data-types#template',
  'date-time': '/configuration/data-types#timestamp',
  duration: '/configuration/data-types#duration',
};

function getItemFromSchema(schema: any, path: string): any {
  const refPath = path.replace('#', '');
  return jsonpointer.get(schema, refPath);
}

function getTitle(schema: any, ref: string): string {
  const item = getItemFromSchema(schema, ref);
  return item?.title || item?.name || '';
}

function getTypeLink(ref: string): string | undefined {
  const refId = ref.split('/').at(-1);
  return refId ? valueTypeLinks[refId] : undefined;
}

/**
 * Plain-text version of the React `getValueType` — returns a markdown string
 * instead of JSX elements.
 */
function getValueTypeText(schema: any, definition: any): string {
  if (definition.type === 'array') {
    let typeDesc: string;
    if (definition.items?.$ref) {
      const link = getTypeLink(definition.items.$ref);
      const title = getTitle(schema, definition.items.$ref);
      typeDesc = link ? `[${title}](${link})` : title;
    } else {
      typeDesc = getValueTypeText(schema, definition.items);
    }
    return `list of ${typeDesc}`;
  }

  if (definition.$ref !== undefined) {
    const link = getTypeLink(definition.$ref);
    const title = getTitle(schema, definition.$ref);
    return link ? `[${title}](${link})` : title;
  }

  if (definition.anyOf || definition.oneOf || definition.allOf) {
    const defs: any[] = definition.anyOf || definition.oneOf || definition.allOf;
    return defs
      .map((item, index) => {
        const text = getValueTypeText(schema, item);
        if (index === defs.length - 2) return `${text} or `;
        if (index < defs.length - 1) return `${text}, `;
        return text;
      })
      .join('');
  }

  if (definition.enum) {
    return definition.enum
      .map((item: any, index: number) => {
        const val = `\`${item}\``;
        if (index === definition.enum.length - 2) return `${val} or `;
        if (index < definition.enum.length - 1) return `${val}, `;
        return val;
      })
      .join('');
  }

  if (definition.const !== undefined) {
    return `\`${definition.const}\``;
  }

  if (definition.format) {
    const link = valueTypeFormatLinks[definition.format];
    if (link) return `[${definition.format}](${link})`;
  }

  if (definition.type) {
    return `\`${definition.type}\``;
  }

  return '';
}

// ── Markdown table builders ─────────────────────────────────────────────────

/** Escape pipe characters inside markdown table cells. */
function escapeCell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function formatDefault(value: any): string {
  if (value === null || value === undefined) return '';
  const dumped = yaml
    .dump(value, {
      noCompatMode: true,
      lineWidth: -1,
      quotingType: '"',
      noRefs: true,
    })
    .trim();
  return `\`${dumped}\``;
}

function cleanDescription(desc: string | undefined): string {
  if (!desc) return '';
  // The descriptions are plain markdown already — just collapse newlines for table cells
  return desc.replace(/\n/g, ' ').trim();
}

function buildOptionsTableMarkdown(defName: string): string {
  const def = (configSchema as any).$defs[defName];
  if (!def?.properties) return `<!-- Unknown definition: ${defName} -->\n`;

  const options = def.properties;
  const entries = Object.entries(options).sort(([a], [b]) => a.localeCompare(b));

  const hasDefault = entries.some(([, d]: [string, any]) => d.default !== undefined);
  const hasDeprecated = entries.some(([, d]: [string, any]) => d.deprecated);

  // Build header
  const headers = ['Key name', 'Value type', 'Description'];
  if (hasDefault) headers.push('Default');
  if (hasDeprecated) headers.push('');
  const separators = headers.map(() => '---');

  const rows: string[] = [];
  rows.push(`| ${headers.join(' | ')} |`);
  rows.push(`| ${separators.join(' | ')} |`);

  for (const [key, definition] of entries) {
    const d = definition as any;
    const valueType = escapeCell(getValueTypeText(configSchema, d));
    const desc = escapeCell(cleanDescription(d.description));
    const cells = [`\`${key}\``, valueType, desc];
    if (hasDefault) cells.push(d.default !== undefined ? escapeCell(formatDefault(d.default)) : '');
    if (hasDeprecated) cells.push(d.deprecated ? '**deprecated**' : '');
    rows.push(`| ${cells.join(' | ')} |`);
  }

  return rows.join('\n') + '\n';
}

function buildPullRequestAttributesTableMarkdown(): string {
  const attributes = (configSchema as any).$defs.PullRequestAttributes?.properties;
  if (!attributes) return '<!-- PullRequestAttributes definition not found -->\n';

  const entries = Object.entries(attributes).sort(([a], [b]) => a.localeCompare(b));

  const rows: string[] = [];
  rows.push('| Attribute name | Value type | Description |');
  rows.push('| --- | --- | --- |');

  for (const [key, value] of entries) {
    const v = value as any;
    const valueType = escapeCell(getValueTypeText(configSchema, v));
    const desc = escapeCell(cleanDescription(v.description));
    rows.push(`| \`${key}\` | ${valueType} | ${desc} |`);
  }

  return rows.join('\n') + '\n';
}

// ── MDX → Markdown pipeline ────────────────────────────────────────────────

/** Remove MDX import statements. */
function stripImports(source: string): string {
  return source.replace(/^import\s+.*$/gm, '');
}

/** Expand `<OptionsTable def="..." />` and `<ActionOptionsTable def="..." />` tags. */
function expandOptionsTableTags(source: string): string {
  return source.replace(
    /<(?:Options|ActionOptions)Table\s+def=["']([^"']+)["']\s*\/?>/g,
    (_match, defName) => buildOptionsTableMarkdown(defName)
  );
}

/** Expand `<PullRequestAttributesTable />` tag. */
function expandPullRequestAttributesTable(source: string): string {
  return source.replace(/<PullRequestAttributesTable\s*\/?>/g, () =>
    buildPullRequestAttributesTableMarkdown()
  );
}

/** Strip remaining JSX/HTML component tags that can't render as markdown. */
function stripRemainingJsx(source: string): string {
  // Strip self-closing custom components: <Component ... />
  let result = source.replace(/<[A-Z]\w*\s[^>]*\/>/g, '');
  // Strip opening/closing pairs of custom components but keep inner content.
  // Loop until stable to handle nested components (e.g. <DocsetGrid><Docset>...</Docset></DocsetGrid>).
  let prev;
  do {
    prev = result;
    result = result.replace(/<([A-Z]\w*)[^>]*>([\s\S]*?)<\/\1>/g, '$2');
  } while (result !== prev);
  // Strip self-closing custom components without attributes: <Component />
  result = result.replace(/<[A-Z]\w*\s*\/>/g, '');
  return result;
}

/** Collapse runs of 3+ blank lines into 2. */
function collapseBlankLines(source: string): string {
  return source.replace(/\n{3,}/g, '\n\n');
}

/**
 * Convert raw MDX source into clean, LLM-friendly markdown.
 *
 * - Strips import statements
 * - Expands schema-driven table components into markdown tables
 * - Removes remaining JSX tags
 */
export function mdxToMarkdown(source: string): string {
  let result = source;
  result = stripImports(result);
  result = expandOptionsTableTags(result);
  result = expandPullRequestAttributesTable(result);
  result = stripRemainingJsx(result);
  result = collapseBlankLines(result);
  return result;
}
