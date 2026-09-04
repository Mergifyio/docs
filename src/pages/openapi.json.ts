import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { APIRoute } from 'astro';

/**
 * Serves the Mergify OpenAPI description at the conventional discovery path.
 *
 * The spec itself is synced from the engine repository into
 * `public/api-schemas.json`, which is where the API Reference pages read it
 * from. That filename is ours alone, so agents crawling the docs never find
 * it. Tooling — and the "is this site agent-readable" scanners — look for
 * `/openapi.json`, so publish the same bytes there too.
 *
 * This route deliberately does not transform the document: two spellings of
 * the same spec that can disagree would be worse than one obscure path.
 */
export const GET: APIRoute = async () => {
  // Read as a Buffer, not a string: decoding to UTF-16 and re-encoding would
  // make "the same bytes" a claim about a round trip rather than a fact.
  const spec = await readFile(path.join(process.cwd(), 'public', 'api-schemas.json'));

  return new Response(spec, {
    headers: {
      // Plain `application/json` rather than the `application/vnd.oai.openapi+json`
      // media type: every generic JSON client understands it, and clients that do
      // care about OpenAPI read the `openapi` field in the body anyway.
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
};
