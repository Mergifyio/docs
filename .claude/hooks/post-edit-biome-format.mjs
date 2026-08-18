#!/usr/bin/env node
/**
 * PostToolUse(Edit|Write): format the file that was just written with Biome.
 *
 * Biome rewrites the file underneath Claude, so when it actually changes
 * something the model is told to re-read before its next edit.
 */

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import {
  displayPath,
  editedFile,
  fail,
  hasExtension,
  localBin,
  projectDir,
  readHookPayload,
  report,
} from './hook-io.mjs';

const FORMATTED = ['js', 'jsx', 'ts', 'tsx', 'json', 'css'];

const payload = await readHookPayload();
const file = editedFile(payload);
if (file === null || !hasExtension(file, FORMATTED)) process.exit(0);

// No install, no formatting: running Biome through `npx` here would pull an
// arbitrary version off the network in the middle of a tool call.
const biome = localBin(payload, 'biome');
if (biome === null) process.exit(0);

const before = readFileSync(file);
const result = spawnSync(biome, ['format', '--write', file], {
  cwd: projectDir(payload),
  encoding: 'utf8',
});

if (result.error) fail(`Biome could not be run: ${result.error.message}`);
if (result.status !== 0) {
  fail(`Biome failed to format ${displayPath(payload, file)}:\n${result.stderr || result.stdout}`);
}

if (!before.equals(readFileSync(file))) {
  report(`Biome reformatted ${displayPath(payload, file)}. Re-read it before editing it again.`);
}
