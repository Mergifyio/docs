import jsonpointer from 'jsonpointer';

// Reading the documented values of a schema "choice set" (an enum and its
// per-value documentation).
//
// The engine is migrating how it publishes that documentation, so this reader
// deliberately understands every shape a synced schema can currently be in.
// Schema syncs land as direct pushes to main, so the docs repo cannot assume
// the engine side has migrated yet — and both shapes may coexist across the
// configuration schema and the OpenAPI spec for a while.
//
// Metadata shapes, which are *merged* rather than treated as alternatives so a
// half-migrated node keeps rendering every description it publishes:
//   - `x-mergify-enum`: a positional array of `{title, description, deprecated}`
//     aligned with `enum`. The target shape.
//   - `x-enum-descriptions`: a map of raw value -> description sentence. The
//     previous shape; carries no per-value title or deprecation.
//
// The values come from `enum`, from a `const`, or from an `anyOf`/`oneOf` of
// such branches — the shape a composed `Literal` (`Literal["A"] | OtherT`)
// produces. Branches are `$ref`-resolved too: hoisting a repeated enum into a
// shared component leaves `{anyOf: [{$ref: ...}, {type: "null"}]}`, and a
// reader that only resolved the top node would silently render nothing.

export interface EnumChoice {
  value: string;
  /** Display label, when the schema publishes one. */
  title?: string;
  /** May be empty: a value can be published before it is documented. */
  description: string;
  deprecated: boolean;
}

interface SchemaNode {
  $ref?: unknown;
  enum?: unknown;
  const?: unknown;
  anyOf?: unknown;
  oneOf?: unknown;
  'x-mergify-enum'?: unknown;
  'x-enum-descriptions'?: unknown;
}

const MAX_REF_HOPS = 10;

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Follow a `$ref` chain from `node` within `root`, returning the node reached.
 * Stops on a dangling, malformed or cyclic ref and returns what it has, so a
 * schema reshape degrades to an empty table rather than throwing during the
 * Astro build.
 *
 * Uses the same `jsonpointer` the other schema readers use (ConfigOptions,
 * schemaToMarkdown) rather than splitting and decoding by hand: a pointer
 * containing a stray `%` makes `decodeURIComponent` raise, which would break
 * the never-throws contract this function advertises.
 */
export function resolveRef(root: unknown, node: unknown): unknown {
  let current = node;
  for (let hop = 0; hop < MAX_REF_HOPS; hop++) {
    if (!isObject(current)) {
      return current;
    }
    const ref = (current as SchemaNode).$ref;
    if (typeof ref !== 'string' || !ref.startsWith('#/')) {
      return current;
    }
    let target: unknown;
    try {
      target = jsonpointer.get(root as object, ref.slice(1));
    } catch {
      return current;
    }
    if (target === undefined || target === null) {
      return current;
    }
    current = target;
  }
  return current;
}

/**
 * The raw values a resolved node accepts directly (no branch recursion).
 *
 * `const` is stringified the same way `enum` entries are: a single-value
 * choice set publishes `{const: 1}` where a multi-value one publishes
 * `{enum: [1, 2]}`, and accepting only strings would silently drop the
 * former while rendering the latter.
 */
function ownValues(node: SchemaNode): string[] {
  if (Array.isArray(node.enum)) {
    return node.enum.map(String);
  }
  const single = node.const;
  if (single !== undefined && single !== null && typeof single !== 'object') {
    return [String(single)];
  }
  return [];
}

/**
 * Per-value metadata published on `node` or on any node its `$ref` chain
 * passes through.
 *
 * Pydantic publishes an annotation inline for an inlined type but as a
 * *sibling of `$ref`* for a type hoisted into `$defs`, so both the raw node
 * and the resolved target have to be consulted — the same walk
 * `ConfigOptions.getDataTypeLink` performs for `x-mergify-has-data-type`. Nearest wins:
 * a sibling on the referring node overrides the shared component.
 */
function collectMetadata(root: unknown, node: unknown): SchemaNode {
  const merged: SchemaNode = {};
  let current = node;
  for (let hop = 0; hop < MAX_REF_HOPS && isObject(current); hop++) {
    const schema = current as SchemaNode;
    if (merged['x-mergify-enum'] === undefined && Array.isArray(schema['x-mergify-enum'])) {
      merged['x-mergify-enum'] = schema['x-mergify-enum'];
    }
    if (merged['x-enum-descriptions'] === undefined && isObject(schema['x-enum-descriptions'])) {
      merged['x-enum-descriptions'] = schema['x-enum-descriptions'];
    }
    const ref = schema.$ref;
    if (typeof ref !== 'string' || !ref.startsWith('#/')) {
      break;
    }
    let next: unknown;
    try {
      next = jsonpointer.get(root as object, ref.slice(1));
    } catch {
      break;
    }
    if (next === undefined || next === null) {
      break;
    }
    current = next;
  }
  return merged;
}

/**
 * The documented choices of `node` (which may be a `$ref` into `root`).
 * Returns [] for anything that is not a choice set.
 *
 * Branch unions are flattened by concatenation, and each branch supplies the
 * metadata for its own values — so a hoisted enum keeps its descriptions
 * whether the `$ref` sits at the top of the node or inside one of its
 * branches.
 */
export function readEnumChoices(root: unknown, node: unknown): EnumChoice[] {
  return read(root, node, {});
}

function read(root: unknown, node: unknown, inherited: SchemaNode): EnumChoice[] {
  const resolved = resolveRef(root, node);
  if (!isObject(resolved)) {
    return [];
  }

  // Metadata on this node wins over anything inherited from an enclosing
  // union. The engine publishes the annotations at the top of an optional
  // node while the values sit in its non-null branch, so a branch with no
  // metadata of its own must still see the parent's.
  const own = collectMetadata(root, node);
  const meta: SchemaNode = {
    'x-mergify-enum': own['x-mergify-enum'] ?? inherited['x-mergify-enum'],
    'x-enum-descriptions': own['x-enum-descriptions'] ?? inherited['x-enum-descriptions'],
  };

  const values = ownValues(resolved as SchemaNode);
  if (values.length === 0) {
    const branches = (resolved as SchemaNode).anyOf ?? (resolved as SchemaNode).oneOf;
    if (Array.isArray(branches)) {
      return branches.flatMap((branch) => read(root, branch, meta));
    }
    return [];
  }

  const entries = meta['x-mergify-enum'];
  // `x-mergify-enum` is positional, so a length mismatch means every entry
  // after the first divergence describes the wrong value. Publishing 40 subtly
  // wrong sentences is worse than publishing none, and the misalignment is
  // otherwise undetectable — the map shape this replaced could not drift.
  const aligned = Array.isArray(entries) && entries.length === values.length ? entries : undefined;

  const legacy = meta['x-enum-descriptions'];
  const descriptions = isObject(legacy) ? legacy : {};

  return values.map((value, index) => {
    const entry = aligned?.[index];
    const positional = isObject(entry) ? entry : {};
    const fallback = descriptions[value];
    return {
      value,
      title: typeof positional.title === 'string' ? positional.title : undefined,
      description:
        typeof positional.description === 'string' && positional.description !== ''
          ? positional.description
          : typeof fallback === 'string'
            ? fallback
            : '',
      deprecated: positional.deprecated === true,
    };
  });
}
