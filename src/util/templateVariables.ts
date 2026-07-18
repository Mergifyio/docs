export interface TemplateVariable {
  name: string;
  description: string;
  // Some variables resolve to a value drawn from an enumerated data type rather than
  // a free-form string. The schema tags those with a stable token (e.g.
  // `queue-dequeue-reason`) that renderers map to the matching data type section.
  // Absent for free-form string variables.
  type?: string;
}

// Field definitions publish their allowlist under this custom JSON-schema key.
const TEMPLATE_VARIABLES_KEY = 'x-mergify-template-variables';

/**
 * Find the published template-variable allowlist on a JSON-schema field
 * definition. The annotation may sit:
 *  - directly on the field (a required simple-template field, e.g. `close.message`);
 *  - inside an `anyOf`/`oneOf`/`allOf` branch alongside a `null` branch (an optional
 *    field, e.g. `comment.message`);
 *  - under `additionalProperties`/`items` (a dict/array-valued field whose values are
 *    templated, e.g. the `github_actions` `inputs` map).
 * Search recursively and return the first branch that carries it.
 */
export function extractTemplateVariables(definition: unknown): TemplateVariable[] {
  if (!definition || typeof definition !== 'object') {
    return [];
  }

  const node = definition as Record<string, unknown>;

  const direct = node[TEMPLATE_VARIABLES_KEY];
  if (Array.isArray(direct)) {
    return direct as TemplateVariable[];
  }

  for (const key of ['anyOf', 'oneOf', 'allOf'] as const) {
    const branches = node[key];
    if (Array.isArray(branches)) {
      for (const branch of branches) {
        const found = extractTemplateVariables(branch);
        if (found.length > 0) {
          return found;
        }
      }
    }
  }

  for (const key of ['additionalProperties', 'items'] as const) {
    const child = node[key];
    if (child && typeof child === 'object') {
      const found = extractTemplateVariables(child);
      if (found.length > 0) {
        return found;
      }
    }
  }

  return [];
}
