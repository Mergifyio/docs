export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description?: string;
    version: string;
    termsOfService?: string;
    contact?: { name?: string; url?: string; email?: string };
  };
  servers: Array<{ url: string; description?: string }>;
  paths: Record<string, Record<string, Operation>>;
  components: {
    schemas: Record<string, SchemaObject>;
    securitySchemes: Record<string, SecurityScheme>;
  };
}

export interface Operation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  deprecated?: boolean;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses?: Record<string, ResponseObject>;
  security?: Array<Record<string, string[]>>;
}

export interface Parameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean;
  description?: string;
  schema?: SchemaObject;
  deprecated?: boolean;
}

export interface RequestBody {
  required?: boolean;
  content: Record<string, { schema: SchemaObject; example?: unknown }>;
  description?: string;
}

export interface ResponseObject {
  description: string;
  content?: Record<string, { schema: SchemaObject; example?: unknown }>;
}

export interface SchemaObject {
  type?: string;
  format?: string;
  title?: string;
  description?: string;
  properties?: Record<string, SchemaObject>;
  required?: string[];
  items?: SchemaObject;
  enum?: unknown[];
  $ref?: string;
  anyOf?: SchemaObject[];
  oneOf?: SchemaObject[];
  allOf?: SchemaObject[];
  additionalProperties?: boolean | SchemaObject;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  default?: unknown;
  example?: unknown;
  const?: unknown;
  discriminator?: { propertyName: string; mapping?: Record<string, string> };
  metadata?: { description?: string };
}

export interface SecurityScheme {
  type: string;
  scheme?: string;
  description?: string;
}

export interface GroupedEndpoint {
  method: string;
  path: string;
  operation: Operation;
  slug: string;
}

// ---------------------------------------------------------------------------
// Schema resolution
// ---------------------------------------------------------------------------

export function resolveRef(schema: SchemaObject, root: OpenAPISpec): SchemaObject {
  if (!schema?.$ref) return schema;
  const segments = schema.$ref.replace('#/', '').split('/');
  let result: Record<string, unknown> = root as unknown as Record<string, unknown>;
  for (const seg of segments) result = result[decodeURIComponent(seg)] as Record<string, unknown>;
  return result as unknown as SchemaObject;
}

export function getRefName(schema: SchemaObject): string | null {
  if (!schema?.$ref) return null;
  const parts = schema.$ref.split('/');
  return parts[parts.length - 1];
}

// ---------------------------------------------------------------------------
// Pre-processing (mirrors the old client-side transforms)
// ---------------------------------------------------------------------------

export function preprocessSchema(schema: OpenAPISpec): OpenAPISpec {
  const s = structuredClone(schema);

  // Break recursive MatchingConditionsDict schemas
  for (const suffix of ['Input', 'Output']) {
    const key = `MatchingConditionsDict-${suffix}`;
    if (s.components.schemas[key]) {
      s.components.schemas[key] = JSON.parse(
        JSON.stringify(s.components.schemas[key]).replaceAll(
          `#/components/schemas/${key}`,
          '#/components/schemas/MatchingConditionsDict-Limited'
        )
      );
    }
  }
  s.components.schemas['MatchingConditionsDict-Limited'] = {
    properties: {
      and: { items: { type: 'string' }, type: 'array', title: 'And' },
      or: { items: { type: 'string' }, type: 'array', title: 'Or' },
      not: { items: { type: 'string' }, type: 'array', title: 'Not' },
    },
    type: 'object',
    title: 'MatchingConditionsDict-Limited',
  };

  // Strip hidden fields
  const hidden = ['autosquash'];
  const deepRemove = (v: unknown, key: string): void => {
    if (Array.isArray(v)) {
      for (const item of v) deepRemove(item, key);
      return;
    }
    if (v && typeof v === 'object') {
      const obj = v as Record<string, unknown>;
      if (Object.prototype.hasOwnProperty.call(obj, key)) delete obj[key];
      for (const k of Object.keys(obj)) deepRemove(obj[k], key);
    }
  };
  for (const field of hidden) deepRemove(s, field);

  return s;
}

// ---------------------------------------------------------------------------
// Grouping & headings
// ---------------------------------------------------------------------------

export const TAG_LABELS: Record<string, string> = {
  applications: 'Applications',
  queues: 'Queues',
  badges: 'Badges',
  simulator: 'Simulator',
  eventlogs: 'Event Logs',
  statistics: 'Statistics',
  scheduled_freeze: 'Scheduled Freeze',
  merge_queue: 'Merge Queue',
};

// Tag descriptions for sub-page intros
export const TAG_DESCRIPTIONS: Record<string, string> = {
  applications: 'Manage your Mergify application details.',
  queues: 'Configure and inspect merge queues for your repositories.',
  badges: 'Generate status badges for your repositories.',
  simulator: 'Simulate Mergify behavior on pull requests and configurations.',
  eventlogs: 'Retrieve event logs for pull request activity.',
  statistics: 'Access merge queue and CI performance statistics.',
  scheduled_freeze: 'Schedule merge queue freezes for maintenance or release windows.',
  merge_queue: 'Control merge queue state — pause, unpause, and inspect status.',
};

export function humanizeTag(tag: string): string {
  return TAG_LABELS[tag] ?? tag.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function slugifyTag(tag: string): string {
  return tag.toLowerCase().replace(/_/g, '-');
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function groupByTag(schema: OpenAPISpec): Map<string, GroupedEndpoint[]> {
  const groups = new Map<string, GroupedEndpoint[]>();
  const methods = ['get', 'post', 'put', 'delete', 'patch'];

  for (const [path, pathItem] of Object.entries(schema.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!methods.includes(method)) continue;
      for (const tag of operation.tags ?? ['default']) {
        if (!groups.has(tag)) groups.set(tag, []);
        groups.get(tag)!.push({
          method: method.toUpperCase(),
          path,
          operation,
          slug: slugify(operation.operationId ?? `${method}-${path}`),
        });
      }
    }
  }
  return groups;
}

export function getHeadingsForEndpoints(
  endpoints: GroupedEndpoint[]
): Array<{ depth: number; slug: string; text: string }> {
  return endpoints.map((ep) => ({
    depth: 2,
    slug: ep.slug,
    text: ep.operation.summary ?? `${ep.method} ${ep.path}`,
  }));
}

// ---------------------------------------------------------------------------
// Type label helpers
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function getTypeLabel(schema: SchemaObject | undefined, root: OpenAPISpec): string {
  if (!schema) return 'any';

  if (schema.$ref) return getRefName(schema) ?? 'object';

  if (schema.anyOf) {
    const nonNull = schema.anyOf.filter((s) => s.type !== 'null');
    const hasNull = schema.anyOf.some((s) => s.type === 'null');
    if (nonNull.length === 1 && hasNull) {
      return getTypeLabel(nonNull[0], root) + ' | null';
    }
    return schema.anyOf.map((s) => getTypeLabel(s, root)).join(' | ');
  }

  if (schema.oneOf) {
    if (schema.discriminator?.mapping) {
      const count = Object.keys(schema.discriminator.mapping).length;
      return `object (${count} types)`;
    }
    if (schema.oneOf.length > 5) {
      return `one of ${schema.oneOf.length} types`;
    }
    return schema.oneOf.map((s) => getTypeLabel(s, root)).join(' | ');
  }

  if (schema.type === 'array' && schema.items) {
    return `${getTypeLabel(schema.items, root)}[]`;
  }

  if (schema.enum) {
    return schema.enum.map((v) => JSON.stringify(v)).join(' | ');
  }

  let label = schema.type ?? 'any';
  if (schema.format) label += ` <${schema.format}>`;
  return label;
}

// ---------------------------------------------------------------------------
// Constraint rendering
// ---------------------------------------------------------------------------

function renderConstraintsHtml(schema: SchemaObject): string {
  const parts: string[] = [];
  if (schema.minimum !== undefined) parts.push(`min: ${schema.minimum}`);
  if (schema.exclusiveMinimum !== undefined)
    parts.push(`exclusive min: ${schema.exclusiveMinimum}`);
  if (schema.maximum !== undefined) parts.push(`max: ${schema.maximum}`);
  if (schema.exclusiveMaximum !== undefined)
    parts.push(`exclusive max: ${schema.exclusiveMaximum}`);
  if (schema.minLength !== undefined) parts.push(`min length: ${schema.minLength}`);
  if (schema.maxLength !== undefined) parts.push(`max length: ${schema.maxLength}`);
  if (schema.pattern) parts.push(`pattern: <code>${escapeHtml(schema.pattern)}</code>`);
  if (parts.length === 0) return '';
  return `<div class="schema-constraints">${parts.join(' · ')}</div>`;
}

// ---------------------------------------------------------------------------
// Schema → HTML rendering (recursive via string concatenation)
// ---------------------------------------------------------------------------

export function renderSchemaHtml(
  schema: SchemaObject,
  root: OpenAPISpec,
  depth: number = 0,
  visited: Set<string> = new Set()
): string {
  if (!schema) return '';

  if (schema.$ref) {
    const refName = getRefName(schema);
    if (refName && visited.has(refName)) {
      return `<div class="schema-circular"><code>${escapeHtml(refName)}</code> (circular)</div>`;
    }
    if (refName) visited = new Set([...visited, refName]);
    schema = resolveRef(schema, root);
  }

  // anyOf — usually nullable pattern
  if (schema.anyOf) {
    const nonNull = schema.anyOf.filter((s) => s.type !== 'null');
    if (nonNull.length === 1) {
      return renderSchemaHtml(nonNull[0], root, depth, visited);
    }
    if (nonNull.length > 1) {
      return nonNull
        .map(
          (s, i) =>
            `<div class="schema-variant"><span class="schema-variant-label">Variant ${i + 1}</span>${renderSchemaHtml(s, root, depth, visited)}</div>`
        )
        .join('');
    }
    return '';
  }

  // oneOf — discriminated union
  if (schema.oneOf) {
    if (schema.discriminator?.mapping) {
      const entries = Object.entries(schema.discriminator.mapping);
      let html = '<div class="schema-oneof">';
      html += `<div class="schema-discriminator">Discriminated by <code>${escapeHtml(schema.discriminator.propertyName)}</code> — ${entries.length} types</div>`;
      for (const [value, ref] of entries) {
        const name = ref.split('/').pop() ?? '';
        const variantSchema = resolveRef({ $ref: ref }, root);
        const hasProperties = variantSchema.properties && depth < 4;
        if (hasProperties) {
          html += '<details class="schema-variant-expandable">';
          html += `<summary class="schema-variant-summary">`;
          html += `<svg class="schema-chevron" width="12" height="12" viewBox="0 0 12 12"><path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`;
          html += `<code class="schema-variant-value">${escapeHtml(value)}</code>`;
          html += `<span class="schema-type-ref">${escapeHtml(name)}</span>`;
          html += '</summary>';
          html += '<div class="schema-nested-content">';
          html += renderSchemaHtml(variantSchema, root, depth + 1, new Set([...visited, name]));
          html += '</div></details>';
        } else {
          html += `<div class="schema-variant-item"><code class="schema-variant-value">${escapeHtml(value)}</code><span class="schema-variant-arrow">→</span><span class="schema-type-ref">${escapeHtml(name)}</span></div>`;
        }
      }
      html += '</div>';
      return html;
    }
    return schema.oneOf
      .map(
        (s, i) =>
          `<div class="schema-variant"><span class="schema-variant-label">Option ${i + 1}</span>${renderSchemaHtml(s, root, depth, visited)}</div>`
      )
      .join('');
  }

  // Object with properties
  if (schema.properties) {
    const requiredSet = new Set(schema.required ?? []);
    let html = '<div class="schema-properties">';

    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const resolved = propSchema.$ref ? resolveRef(propSchema, root) : propSchema;
      const typeLabel = getTypeLabel(propSchema, root);
      const isRequired = requiredSet.has(propName);
      const description =
        resolved.description ?? propSchema.description ?? resolved.metadata?.description ?? '';

      // Determine if this property is expandable (has nested structure)
      const resolvedForNesting = resolved.anyOf
        ? (() => {
            const nonNull = resolved.anyOf.filter((s: SchemaObject) => s.type !== 'null');
            return nonNull.length === 1
              ? nonNull[0].$ref
                ? resolveRef(nonNull[0], root)
                : nonNull[0]
              : resolved;
          })()
        : resolved;

      const hasNestedContent =
        depth < 4 &&
        ((resolvedForNesting.type === 'object' && resolvedForNesting.properties) ||
          (resolvedForNesting.type === 'array' &&
            resolvedForNesting.items &&
            (resolveRef(resolvedForNesting.items, root).properties ||
              resolvedForNesting.items.$ref ||
              resolvedForNesting.items.oneOf)) ||
          resolvedForNesting.oneOf);

      if (hasNestedContent) {
        html += '<details class="schema-property schema-expandable">';
        html += '<summary class="schema-property-header">';
        html += `<svg class="schema-chevron" width="12" height="12" viewBox="0 0 12 12"><path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`;
        html += `<span class="schema-property-name">${escapeHtml(propName)}</span>`;
        html += `<span class="schema-type-badge">${escapeHtml(typeLabel)}</span>`;
        if (isRequired) html += '<span class="schema-required-badge">required</span>';
        html += '</summary>';
        html += '<div class="schema-nested-content">';
        if (description)
          html += `<p class="schema-property-description">${escapeHtml(description)}</p>`;

        // Render nested content
        if (resolvedForNesting.type === 'array' && resolvedForNesting.items) {
          html += renderSchemaHtml(resolvedForNesting.items, root, depth + 1, visited);
        } else {
          html += renderSchemaHtml(resolvedForNesting, root, depth + 1, visited);
        }

        html += '</div></details>';
      } else {
        html += '<div class="schema-property">';
        html += '<div class="schema-property-header">';
        html += `<span class="schema-property-name">${escapeHtml(propName)}</span>`;
        html += `<span class="schema-type-badge">${escapeHtml(typeLabel)}</span>`;
        if (isRequired) html += '<span class="schema-required-badge">required</span>';
        html += '</div>';
        if (description)
          html += `<p class="schema-property-description">${escapeHtml(description)}</p>`;
        if (resolved.enum) {
          html += `<div class="schema-enum">Enum: ${resolved.enum.map((v: unknown) => `<code>${escapeHtml(String(v))}</code>`).join(' ')}</div>`;
        }
        html += renderConstraintsHtml(resolved);
        html += '</div>';
      }
    }

    if (schema.additionalProperties) {
      const valueType =
        typeof schema.additionalProperties === 'object'
          ? getTypeLabel(schema.additionalProperties, root)
          : null;
      const label = valueType
        ? `Additional properties: <span class="schema-type-badge">${escapeHtml(valueType)}</span>`
        : 'Additional properties allowed';
      html += `<div class="schema-property"><div class="schema-property-header"><span class="schema-property-name schema-additional">${label}</span></div></div>`;
    }

    html += '</div>';
    return html;
  }

  // Array without object items
  if (schema.type === 'array' && schema.items) {
    return renderSchemaHtml(schema.items, root, depth, visited);
  }

  // Simple type
  return `<div class="schema-simple-type"><span class="schema-type-badge">${escapeHtml(getTypeLabel(schema, root))}</span></div>`;
}

// ---------------------------------------------------------------------------
// Example generation
// ---------------------------------------------------------------------------

export function generateExample(
  schema: SchemaObject,
  root: OpenAPISpec,
  depth: number = 0,
  visited: Set<string> = new Set()
): unknown {
  if (!schema) return null;

  if (schema.$ref) {
    const name = getRefName(schema);
    if (name && visited.has(name)) return '...';
    if (name) visited = new Set([...visited, name]);
    schema = resolveRef(schema, root);
  }

  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.const !== undefined) return schema.const;

  if (schema.anyOf) {
    const nonNull = schema.anyOf.filter((s) => s.type !== 'null');
    if (nonNull.length > 0) return generateExample(nonNull[0], root, depth, visited);
    return null;
  }

  if (schema.oneOf?.length) return generateExample(schema.oneOf[0], root, depth, visited);

  if (schema.properties && depth < 3) {
    const obj: Record<string, unknown> = {};
    for (const [key, prop] of Object.entries(schema.properties)) {
      obj[key] = generateExample(prop, root, depth + 1, visited);
    }
    return obj;
  }

  if (schema.type === 'array' && schema.items && depth < 3) {
    return [generateExample(schema.items, root, depth + 1, visited)];
  }

  if (schema.enum?.length) return schema.enum[0];

  switch (schema.type) {
    case 'string':
      if (schema.format === 'date-time') return '2024-01-15T09:00:00Z';
      if (schema.format === 'date') return '2024-01-15';
      if (schema.format === 'uri' || schema.format === 'url') return 'https://example.com';
      return 'string';
    case 'integer':
      return schema.minimum ?? 0;
    case 'number':
      return schema.minimum ?? 0;
    case 'boolean':
      return true;
    case 'object':
      return {};
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

const AUTH_LABELS: Record<string, string> = {
  ApplicationAuth: 'Application Key',
  GitHubTokenBearerAuth: 'GitHub Token',
};

export function getAuthLabels(security: Array<Record<string, string[]>> | undefined): string[] {
  if (!security) return [];
  return security
    .map((sec) => {
      const name = Object.keys(sec)[0];
      return name ? (AUTH_LABELS[name] ?? name) : undefined;
    })
    .filter((label): label is string => label !== undefined);
}
