#!/usr/bin/env node
/**
 * PostToolUse(Edit|Write): every MDX page needs YAML frontmatter.
 *
 * Without it the content collection schema rejects the file and the build
 * fails, so this is worth stopping the model on rather than mentioning.
 */

import { readFileSync } from 'node:fs';

import { displayPath, editedFile, fail, hasExtension, readHookPayload } from './hook-io.mjs';

const payload = await readHookPayload();
const file = editedFile(payload);
if (file === null || !hasExtension(file, ['mdx'])) process.exit(0);

const firstLine = readFileSync(file, 'utf8').split('\n', 1)[0];
if (firstLine.trimEnd() !== '---') {
  fail(
    `${displayPath(payload, file)} does not start with YAML frontmatter. ` +
      'An MDX page must open with a `---` line and declare `title` and `description`.'
  );
}
