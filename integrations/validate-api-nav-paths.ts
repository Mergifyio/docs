import type { AstroIntegration } from 'astro';
import rawApiSchema from '../public/api-schemas.json';
import { type OpenAPISpec, preprocessSchema } from '../src/components/ApiReference/openapi';
import { danglingApiNavPaths } from '../src/util/apiNavPaths';

/**
 * Fail the build when the sidebar points at an `/api/*` page that no longer
 * exists. Those pages are generated from the OpenAPI spec's tags, so renaming
 * a tag silently deletes a route — which is how the `eventlogs` →
 * `activity_log` rename left `/api/eventlogs` 404ing from every page on the
 * site.
 *
 * This has to run at build time rather than only in the link check: the spec
 * arrives by bot sync pushed straight to main, which opens no pull request,
 * and CI runs on `pull_request` only. The deploy build is the sole gate a
 * sync passes through. apiNavPaths.test.ts runs the same check in pull
 * request CI for earlier feedback on docs-side edits.
 */
export function validateApiNavPaths(): AstroIntegration {
  return {
    name: 'validate-api-nav-paths',
    hooks: {
      'astro:build:start': () => {
        const dangling = danglingApiNavPaths(
          preprocessSchema(rawApiSchema as unknown as OpenAPISpec)
        );

        if (dangling.length > 0) {
          throw new Error(
            `src/content/navItems.tsx links to ${dangling.join(', ')}, which no longer ` +
              `exist. Every /api/* route comes from a tag in public/api-schemas.json or a ` +
              `page in src/content/docs/api/ — point the entry at the tag's current slug ` +
              `(and add a redirect in public/_redirects, since the old URL was published).`
          );
        }
      },
    },
  };
}
