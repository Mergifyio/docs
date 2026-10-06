// The engine flags a configuration option that is still experimental with
// `x-mergify-experimental: true` and strips its description, examples and other
// reader-facing facts. The option stays in the schema because the schema is also
// the validation contract: editors and `mergify config validate` must keep
// accepting a configuration that uses it. The docs must not list it, so every
// schema-driven table skips a flagged node. Nothing is recorded on the docs side:
// once the engine drops the flag, the option shows up again with the next sync.
//
// The flag sits on the property node itself, or on a `$defs` entry that is only
// reachable through experimental options. A property that reaches such an entry
// through a `$ref` (or through `items`, a union branch, or a map's value type) is
// experimental too, including through an unflagged wrapper entry such as a list
// definition whose `items` is the flagged model.
const EXPERIMENTAL_KEY = 'x-mergify-experimental';

const DEFS_REF_PREFIX = '#/$defs/';

const WRAPPER_KEYS = ['anyOf', 'oneOf', 'allOf'] as const;

function isFlagged(node: unknown): boolean {
  return (
    !!node &&
    typeof node === 'object' &&
    (node as Record<string, unknown>)[EXPERIMENTAL_KEY] === true
  );
}

export function isExperimental(schema: object, node: unknown): boolean {
  const defs = (schema as { $defs?: Record<string, unknown> }).$defs ?? {};
  // Definitions can refer to each other in a cycle, so each is followed once.
  const followed = new Set<string>();

  const reachesFlag = (current: unknown): boolean => {
    if (!current || typeof current !== 'object') {
      return false;
    }
    if (isFlagged(current)) {
      return true;
    }
    const { $ref, items, additionalProperties } = current as Record<string, unknown>;
    if (typeof $ref === 'string' && $ref.startsWith(DEFS_REF_PREFIX)) {
      const name = $ref.slice(DEFS_REF_PREFIX.length);
      if (!followed.has(name)) {
        followed.add(name);
        if (reachesFlag(defs[name])) {
          return true;
        }
      }
    }
    if (reachesFlag(items) || reachesFlag(additionalProperties)) {
      return true;
    }
    return WRAPPER_KEYS.some((key) => {
      const branches = (current as Record<string, unknown>)[key];
      return Array.isArray(branches) && branches.some(reachesFlag);
    });
  };

  return reachesFlag(node);
}

/**
 * The entries of a schema `properties` map that the docs may list: every
 * property except the experimental ones.
 */
export function documentedEntries<T>(
  schema: object,
  properties: Record<string, T> | undefined
): [string, T][] {
  return Object.entries(properties ?? {}).filter(
    ([, definition]) => !isExperimental(schema, definition)
  );
}
