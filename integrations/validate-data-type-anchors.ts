import type { AstroIntegration } from 'astro';
import rawApiSchema from '../public/api-schemas.json';
import rawConfigSchema from '../public/mergify-configuration-schema.json';
import { missingDataTypeAnchors } from '../src/util/dataTypeAnchors';

// Both synced schemas can carry the engine's `x-has-data-type` marker: the
// configuration schema for types you write in `.mergify.yml`, the OpenAPI spec
// for types the API only reports (a batch status, say). Both arrive by the same
// bot sync, so both need the same gate.
const SCHEMAS: { file: string; schema: unknown }[] = [
  { file: 'public/mergify-configuration-schema.json', schema: rawConfigSchema },
  { file: 'public/api-schemas.json', schema: rawApiSchema },
];

/**
 * Fail the build when a synced schema flags a documented data type whose
 * derived anchor (slugified `title`) has no matching heading on the
 * data-types page. This is the enforcement point that actually guards the
 * drift path: schema syncs land as direct bot pushes to main (no PR, so no
 * PR CI), and the deploy build is the only gate they pass through.
 * dataType.test.ts runs the same check in PR CI for earlier feedback on
 * docs-side edits.
 */
export function validateDataTypeAnchors(): AstroIntegration {
  return {
    name: 'validate-data-type-anchors',
    hooks: {
      'astro:build:start': () => {
        const problems = SCHEMAS.flatMap(({ file, schema }) => {
          const missing = missingDataTypeAnchors(schema);
          return missing.length > 0 ? [`${file}: ${missing.join(', ')}`] : [];
        });

        if (problems.length > 0) {
          throw new Error(
            `Documented data type(s) in a synced schema have no matching heading anchor on ` +
              `src/content/docs/configuration/data-types.mdx — ${problems.join('; ')}. ` +
              `A marked node's slugified title must equal the anchor of its section heading ` +
              `(add the missing section, or fix the title next to the engine's DocsDataType ` +
              `annotation).`
          );
        }
      },
    },
  };
}
