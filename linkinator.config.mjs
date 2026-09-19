/**
 * Config for `pnpm check:links`.
 *
 * Kept as `.mjs` rather than the `.json` linkinator picks up by default so
 * `EXTERNAL_LINK` can carry this comment and be unit-tested
 * (linkinator.config.test.mjs). Both matter: the rule below has a silent
 * failure mode that disabled the whole check for months.
 */

/**
 * Skip every off-site link, so CI never fails on someone else's outage or
 * bot wall. Only links within the built site are verified.
 *
 * The negative lookahead is load-bearing. `linkinator dist/` serves the build
 * from a local HTTP server and crawls it, so the pages under test are
 * themselves `http://` URLs: a bare `https?://` rule matches the crawl root
 * and linkinator exits happily having scanned zero links. That is precisely
 * what the previous `--skip 'https?://'` did, which is why a sidebar link to a
 * deleted `/api/*` page shipped green.
 *
 * Both hosts have to be excluded: linkinator binds the server to `127.0.0.1`
 * (the crawl root) but builds its trailing-slash redirects against
 * `localhost`. Excluding only one leaves every directory-style URL — nearly
 * every page on the site — skipped at the redirect hop.
 */
export const EXTERNAL_LINK = '^https?://(?!(?:127\\.0\\.0\\.1|localhost)[:/])';

export default {
  recurse: true,
  verbosity: 'error',
  skip: [EXTERNAL_LINK],

  /**
   * linkinator crawls the built site through a static server it runs itself,
   * and that server drops the occasional connection when several hundred
   * pages are pulled at once — surfacing as a status-0 "broken" link on a
   * different file each run. Back the concurrency off and retry those.
   *
   * `retryErrors` only covers status 0, 5xx and 429; a 404 is never retried,
   * so this buys reliability without softening the check that matters.
   *
   * `retryErrorsCount` and `retryErrorsJitter` are deliberately absent: meow
   * declares defaults for both, and a flag with a default is never `undefined`
   * for linkinator's config merge to strip, so a value set here would be
   * silently overridden by the built-in 5 and 3000ms. Set them on the command
   * line if they ever need changing.
   */
  concurrency: 10,
  retryErrors: true,

  /**
   * Validate the `#anchor` half of every link too, not just the page it points
   * at. Without this a link to a heading that was renamed or deleted scans as
   * green, because the page still answers 200 — the failure mode the bash
   * script this check replaced also had, since it stripped the fragment before
   * looking anything up. Anchors have never been checked here; now they are.
   *
   * Only our own anchors get checked: `skip: [EXTERNAL_LINK]` drops off-site
   * links before linkinator ever looks at their fragments, so nobody else's
   * heading rename can turn CI red.
   *
   * Unlike the retry knobs above, this one does apply from config: meow
   * declares it `{ type: 'boolean' }` under `booleanDefault: undefined`, so an
   * unpassed `--check-fragments` is stripped from the merge instead of
   * overriding us with `false`.
   */
  checkFragments: true,
};
