import type { AstroIntegration } from 'astro';
import rawConfigSchema from '../public/mergify-configuration-schema.json';
import { missingDataTypeAnchors } from '../src/util/dataTypeAnchors';

/**
 * Fail the build when the config schema flags a documented data type whose
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
        const missing = missingDataTypeAnchors(rawConfigSchema);
        if (missing.length > 0) {
          throw new Error(
            `Documented data type(s) in public/mergify-configuration-schema.json have no ` +
              `matching heading anchor on src/content/docs/configuration/data-types.mdx: ` +
              `${missing.join(', ')}. A marked node's slugified title must equal the anchor ` +
              `of its section heading (add the missing section, or fix the title next to the ` +
              `engine's DocsDataType annotation).`
          );
        }
      },
    },
  };
}
