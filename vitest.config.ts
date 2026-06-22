import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Resolve the `~/*` -> src/* alias (declared in tsconfig) for unit tests, so
// component modules that import via `~` — e.g. CliReference/cli-schema — can be
// tested directly. Astro provides this alias at build time but not to Vitest.
export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
