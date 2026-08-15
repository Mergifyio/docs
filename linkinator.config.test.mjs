import { describe, expect, it } from 'vitest';
import config, { EXTERNAL_LINK } from './linkinator.config.mjs';

/**
 * linkinator applies `skip` with `new RegExp(rule).test(url)` against the
 * absolute URL of every link it is about to fetch — including the crawl root
 * and every redirect target. A rule that over-matches does not fail the build,
 * it silently shrinks the crawl, so these cases are the only thing standing
 * between us and a link check that scans nothing.
 */
describe('EXTERNAL_LINK', () => {
  const skips = (url) => new RegExp(EXTERNAL_LINK).test(url);

  it('skips off-site links', () => {
    expect(skips('https://github.com/Mergifyio')).toBe(true);
    expect(skips('http://example.com/whatever')).toBe(true);
    expect(skips('https://docs.mergify.com/api/activity-log')).toBe(true);
  });

  it('keeps the local crawl root, which linkinator binds to 127.0.0.1', () => {
    expect(skips('http://127.0.0.1:3000/')).toBe(false);
    expect(skips('http://127.0.0.1:3000/api/activity-log')).toBe(false);
  });

  it('keeps redirect targets, which linkinator builds against localhost', () => {
    expect(skips('http://localhost:3000/api/activity-log/')).toBe(false);
    expect(skips('http://localhost:3000/')).toBe(false);
  });

  // Without the trailing `[:/]` these would be treated as our own server.
  it('does not mistake a look-alike host for the local server', () => {
    expect(skips('https://localhost.example.com/')).toBe(true);
    expect(skips('https://127.0.0.1.example.com/')).toBe(true);
  });

  // linkinator splits every skip rule on /[\s,]+/ and compiles the shards
  // separately, so a rule carrying either would silently become a different,
  // broader rule (and possibly an invalid one).
  it('survives the split linkinator applies to skip rules', () => {
    expect(EXTERNAL_LINK.split(/[\s,]+/)).toEqual([EXTERNAL_LINK]);
  });
});

describe('the exported config', () => {
  // `recurse` lives only here now that the npm script passes no flags but
  // --server-root and --config: drop it and the crawl silently becomes one page.
  it('recurses, or the crawl never leaves the entry points', () => {
    expect(config.recurse).toBe(true);
  });

  it('skips using the rule asserted above', () => {
    expect(config.skip).toEqual([EXTERNAL_LINK]);
  });

  // meow declares defaults for these two, and a flag holding a default is
  // never stripped from the merge, so a value set here would never apply.
  it('omits the retry knobs that config cannot actually set', () => {
    expect(config.retryErrors).toBe(true);
    expect(config).not.toHaveProperty('retryErrorsCount');
    expect(config).not.toHaveProperty('retryErrorsJitter');
  });
});
