#!/usr/bin/env node
/**
 * PostToolUse(Edit|Write): type-check the project after a TypeScript edit.
 *
 * `tsc --noEmit` covers the whole project, so it also reports errors in files
 * this edit never touched — mid-refactor that is normal and not something to
 * stop for. The hook therefore only ever reports; it never fails the tool call.
 */

import { spawnSync } from 'node:child_process';

import {
  editedFile,
  hasExtension,
  localBin,
  projectDir,
  readHookPayload,
  report,
} from './hook-io.mjs';

const MAX_REPORTED_ERRORS = 10;

const payload = await readHookPayload();
const file = editedFile(payload);
if (file === null || !hasExtension(file, ['ts', 'tsx'])) process.exit(0);

const tsc = localBin(payload, 'tsc');
if (tsc === null) process.exit(0);

// `--pretty false` is load-bearing: tsc colourises its output even when stdout
// is a pipe, and the ANSI codes land between "error" and "TS2322", so matching
// on `error TS` against pretty output silently finds nothing.
const result = spawnSync(tsc, ['--noEmit', '--pretty', 'false'], {
  cwd: projectDir(payload),
  encoding: 'utf8',
});
if (result.error || result.status === 0) process.exit(0);

const errors = `${result.stdout}${result.stderr}`
  .split('\n')
  .filter((line) => line.includes('error TS'));
if (errors.length === 0) process.exit(0);

const shown = errors.slice(0, MAX_REPORTED_ERRORS).join('\n');
const rest =
  errors.length > MAX_REPORTED_ERRORS ? `\n(+${errors.length - MAX_REPORTED_ERRORS} more)` : '';
report(
  `\`tsc --noEmit\` reports ${errors.length} type error(s) across the project. ` +
    `Some may predate this edit — fix the ones it introduced.\n${shown}${rest}`
);
