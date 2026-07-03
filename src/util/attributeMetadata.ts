// Pull-request attribute definitions publish provenance under this custom
// JSON-schema key.
const ATTRIBUTE_METADATA_KEY = 'x-mergify-attribute-metadata';

function getAttributeMetadata(definition: unknown): Record<string, unknown> | undefined {
  if (!definition || typeof definition !== 'object') {
    return undefined;
  }

  const metadata = (definition as Record<string, unknown>)[ATTRIBUTE_METADATA_KEY];
  if (metadata && typeof metadata === 'object') {
    return metadata as Record<string, unknown>;
  }

  return undefined;
}

/**
 * Return the `source` recorded on a pull-request attribute definition, or
 * `undefined` when the attribute carries no metadata. A `github` source marks
 * attributes that Mergify loads from GitHub rulesets and branch protection:
 * they are read-only and cannot be set in the configuration.
 */
export function getAttributeSource(definition: unknown): string | undefined {
  const source = getAttributeMetadata(definition)?.source;
  return typeof source === 'string' ? source : undefined;
}

/**
 * Return the GitHub documentation URL recorded on a pull-request attribute
 * definition, or `undefined` when the attribute carries none. Sourced
 * attributes link to the GitHub documentation of the enforcement option they
 * mirror.
 */
export function getAttributeDocumentationUrl(definition: unknown): string | undefined {
  const url = getAttributeMetadata(definition)?.documentation_url;
  return typeof url === 'string' ? url : undefined;
}
