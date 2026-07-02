// Pull-request attribute definitions publish provenance under this custom
// JSON-schema key.
const ATTRIBUTE_METADATA_KEY = 'x-mergify-attribute-metadata';

/**
 * Return the `source` recorded on a pull-request attribute definition, or
 * `undefined` when the attribute carries no metadata. A `github` source marks
 * attributes that Mergify loads from GitHub rulesets and branch protection:
 * they are read-only and cannot be set in the configuration.
 */
export function getAttributeSource(definition: unknown): string | undefined {
  if (!definition || typeof definition !== 'object') {
    return undefined;
  }

  const metadata = (definition as Record<string, unknown>)[ATTRIBUTE_METADATA_KEY];
  if (metadata && typeof metadata === 'object') {
    const source = (metadata as Record<string, unknown>).source;
    return typeof source === 'string' ? source : undefined;
  }

  return undefined;
}
