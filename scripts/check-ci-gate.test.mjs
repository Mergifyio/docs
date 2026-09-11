import { describe, expect, it } from 'vitest';
import { failingJobs } from './check-ci-gate.mjs';

const ok = (result = 'success') => ({ result });

describe('failingJobs', () => {
  it('passes when every dependency succeeded', () => {
    expect(failingJobs({ lint: ok(), build: ok(), test: ok() }, [])).toEqual([]);
  });

  it('turns a red dependency into a gate failure', () => {
    expect(failingJobs({ lint: ok(), build: ok('failure'), test: ok() }, [])).toEqual(['build']);
  });

  it('treats a cancelled dependency as a failure', () => {
    expect(failingJobs({ build: ok('cancelled') }, [])).toEqual(['build']);
  });

  it('treats a skipped dependency as a failure', () => {
    // A job that only declares `needs:` is skipped, not failed, the moment a
    // dependency fails — this is exactly the case the gate exists to catch.
    expect(failingJobs({ 'test-broken-links': ok('skipped') }, [])).toEqual(['test-broken-links']);
  });

  it('reports every failing dependency, not just the first', () => {
    expect(failingJobs({ lint: ok('failure'), build: ok('failure'), test: ok() }, [])).toEqual([
      'lint',
      'build',
    ]);
  });

  it('excuses a broken-links failure when the label is present', () => {
    expect(
      failingJobs({ build: ok(), 'test-broken-links': ok('failure') }, ['ignore-broken-links'])
    ).toEqual([]);
  });

  it('still fails on a broken-links failure without the label', () => {
    expect(
      failingJobs({ build: ok(), 'test-broken-links': ok('failure') }, ['some-other-label'])
    ).toEqual(['test-broken-links']);
  });

  it('does not let the label excuse an unrelated job', () => {
    expect(failingJobs({ build: ok('failure') }, ['ignore-broken-links'])).toEqual(['build']);
  });
});
