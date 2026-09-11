#!/usr/bin/env node
/**
 * Decide whether the `gate` job in `ci.yaml` should pass, given the results of
 * every job it depends on.
 *
 * `needs:` alone cannot do this: a job that only declares `needs:` is SKIPPED
 * the moment one dependency fails or is cancelled — not failed — and a
 * required-check ruleset reads a skipped check as "nothing to report", not as
 * red. `gate` runs with `if: always()` so it always executes, then calls this
 * to turn any non-passing dependency into an explicit failure.
 *
 * `test-broken-links` is the one exception: `.mergify.yml` used to let a PR
 * merge over a broken-links failure when labeled `ignore-broken-links`, and a
 * ruleset required check has no way to express "unless labeled X". This
 * reimplements that escape hatch so it isn't silently lost.
 *
 * Usage: node scripts/check-ci-gate.mjs
 *   Reads NEEDS_CONTEXT (the workflow's `needs` context, as JSON — each entry
 *   shaped like `{"result": "success" | "failure" | "cancelled" | "skipped"}`)
 *   and PR_LABELS (the PR's label names, as a JSON array of strings) from the
 *   environment.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** job name -> label that excuses a non-success result for it. */
const EXEMPT_WHEN_LABELED = {
  'test-broken-links': 'ignore-broken-links',
};

/**
 * @param {Record<string, {result: string}>} needs
 * @param {string[]} labels
 * @returns {string[]} names of dependency jobs that should fail the gate
 */
export function failingJobs(needs, labels) {
  return Object.entries(needs)
    .filter(([name, job]) => {
      if (job.result === 'success') return false;
      const excusingLabel = EXEMPT_WHEN_LABELED[name];
      return !(excusingLabel && labels.includes(excusingLabel));
    })
    .map(([name]) => name);
}

function main() {
  const needs = JSON.parse(process.env.NEEDS_CONTEXT ?? '{}');
  const labels = JSON.parse(process.env.PR_LABELS ?? '[]');

  const failed = failingJobs(needs, labels);
  if (failed.length > 0) {
    console.error(`Required job(s) did not succeed: ${failed.join(', ')}`);
    return 1;
  }
  console.log('All required CI jobs succeeded.');
  return 0;
}

// Run as a CLI only when invoked directly, so tests can import failingJobs.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
