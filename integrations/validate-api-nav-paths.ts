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
 * apiNavPaths.test.ts runs the same check in pull request CI, which is where
 * the schema sync is caught — it arrives as a bot pull request, not a push.
 * This copy runs on the deploy build because the two sides of the check land
 * in separate pull requests: a sync that retires a tag and an unrelated edit
 * that links it are each green alone and broken once both are on main.
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
              `page in src/content/docs/api/. If the tag was renamed upstream, point the ` +
              `entry at its current slug; if it was retired, drop the entry. Either way ` +
              `add a redirect in public/_redirects, since the old URL was published.`
          );
        }
      },
    },
  };
}
