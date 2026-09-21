/**
 * Enterprise release timeline.
 *
 * Two independent sources are joined to describe an on-premise release:
 *
 *  - `src/data/enterprise-releases.json` — every tag, synced automatically when
 *    a release is cut. It is the authoritative answer to "which releases exist",
 *    and it is never edited by hand.
 *  - the `changelog` collection — one dated entry per user-visible change,
 *    written for the hosted service, which has no version.
 *
 * A change announced on a given day is on `main` that day, and a tag is cut from
 * `main`, so the first release tagged after the announcement is the first release
 * that carries it. That gives every release a date window over the changelog and
 * therefore a list of the changes it ships, with no per-release bookkeeping.
 *
 * The window is only meaningful for the *first* tag of a `MAJOR.MINOR` line.
 * A later tag in the same line is a patch release: it carries backported fixes,
 * not everything that landed on `main` since the tag before it, so attributing a
 * date range to it would overstate what it contains. Patch releases therefore get
 * no derived list — what they carry is described by hand or not at all.
 */

export interface EnterpriseRelease {
  version: string;
  releasedAt: string;
}

export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
}

/**
 * How a release is labelled, read off the version number alone so that the badge
 * cannot contradict the version printed next to it. This is deliberately not the
 * same question as whether a release opens a line and gets a change window:
 * 8.10.1 opens the 8.10 line (8.10.0 was never cut) and is still a patch.
 */
export type ReleaseKind =
  /** `X.0.0` — the only releases that may carry breaking changes. */
  | 'major'
  /** `X.Y.0` — new features, backward compatible. */
  | 'minor'
  /** `X.Y.Z` with a non-zero patch number. */
  | 'patch';

export interface TimelineRelease {
  version: string;
  parsed: ParsedVersion;
  releasedAt: string;
  kind: ReleaseKind;
  /**
   * Half-open date range `(from, to]` over the changelog, or `null` for a release
   * that does not open its `X.Y` line — a later tag there carries backported fixes
   * only. `from` is `null` for the very first release on record, which has no
   * predecessor to bound it.
   */
  changeWindow: { from: string | null; to: string } | null;
}

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

/** Parse `MAJOR.MINOR.PATCH`, or return `null` for anything else. */
export function parseVersion(version: string): ParsedVersion | null {
  const match = SEMVER.exec(version.trim());
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

/** Compare two parsed versions, ascending. */
export function compareVersions(a: ParsedVersion, b: ParsedVersion): number {
  return a.major - b.major || a.minor - b.minor || a.patch - b.patch;
}

/**
 * Build the release timeline, newest first.
 *
 * Releases are ordered by semver rather than by date, because the two disagree:
 * a patch backported into an older line is tagged after the minor release that
 * superseded it (8.4.2 and 8.4.3 were both cut after 8.5.0). Ordering by date
 * would interleave those lines and hand the wrong window to whatever followed.
 *
 * Every release on record takes part in the ordering even when it is not
 * returned, so the oldest release above `minMajor` still gets the boundary of the
 * release below it.
 */
export function buildReleaseTimeline(
  releases: EnterpriseRelease[],
  options: { minMajor?: number } = {}
): TimelineRelease[] {
  const { minMajor = 0 } = options;

  const parsed = releases
    .map((release) => ({ release, parsed: parseVersion(release.version) }))
    .filter((item): item is { release: EnterpriseRelease; parsed: ParsedVersion } =>
      Boolean(item.parsed)
    )
    .sort((a, b) => compareVersions(a.parsed, b.parsed));

  // The previous line opener bounds the next one's window. Tracked as we walk
  // upwards so the boundary is a semver predecessor, never a date predecessor.
  let previousLineOpenedAt: string | null = null;
  const timeline: TimelineRelease[] = [];

  for (let index = 0; index < parsed.length; index++) {
    const { release, parsed: version } = parsed[index];
    const previous = index > 0 ? parsed[index - 1].parsed : null;
    const opensLine =
      previous === null || previous.major !== version.major || previous.minor !== version.minor;

    // `kind` and the change window answer different questions, so they must not
    // share a predicate. The window follows `opensLine`, a fact about the tag
    // history: 8.10.0 was never cut, so 8.10.1 opens that line and carries its
    // changes. The badge is printed beside the version string, so it follows the
    // version instead — 8.10.1 reads as a patch however much it carries.
    const kind: ReleaseKind = version.patch > 0 ? 'patch' : version.minor === 0 ? 'major' : 'minor';

    timeline.push({
      version: release.version,
      parsed: version,
      releasedAt: release.releasedAt,
      kind,
      changeWindow: opensLine ? { from: previousLineOpenedAt, to: release.releasedAt } : null,
    });

    if (opensLine) previousLineOpenedAt = release.releasedAt;
  }

  return timeline.filter((entry) => entry.parsed.major >= minMajor).reverse();
}

/**
 * Report line openers whose date is not after the line opener below them.
 *
 * Every window is derived from this ordering, so an out-of-order tag silently
 * empties a release's change list instead of failing. A test asserts this is
 * empty for the real data, which turns that silence into a red build.
 */
export function findOutOfOrderReleases(releases: EnterpriseRelease[]): string[] {
  const timeline = buildReleaseTimeline(releases).slice().reverse();
  const offenders: string[] = [];

  for (const entry of timeline) {
    const { changeWindow } = entry;
    if (!changeWindow?.from) continue;
    if (new Date(changeWindow.to).getTime() <= new Date(changeWindow.from).getTime()) {
      offenders.push(entry.version);
    }
  }

  return offenders;
}

/**
 * Select the changelog entries a release carries: everything announced after the
 * release below it and up to and including its own tag.
 *
 * Both ends compare full timestamps. A changelog date carries no time and lands
 * on UTC midnight, while a tag never does, so an entry announced on the day of a
 * tag falls inside that tag's window and outside the next one — counted once.
 */
export function selectWindowEntries<T extends { date: Date | string }>(
  entries: T[],
  changeWindow: TimelineRelease['changeWindow']
): T[] {
  if (!changeWindow) return [];

  const from = changeWindow.from === null ? null : new Date(changeWindow.from).getTime();
  const to = new Date(changeWindow.to).getTime();

  return entries.filter((entry) => {
    const at = new Date(entry.date).getTime();
    return at <= to && (from === null || at > from);
  });
}

/*
  A title reporting a deprecation or a removal.

  Split in two because `remove` has a second, innocent life as a feature verb.
  `removed`, `removal` and `deprecat…` are safe anywhere in a title, as long as the
  match is a whole word — `Add added/modified/removed-files attributes` names an
  attribute, not a removal. Bare `remove` is only taken at the start of a title,
  which is how a removal is announced (`Remove deprecated options of queue action`)
  and not how a feature is (`Add/remove queued label automatically on PRs`).

  Measured over every changelog entry: these two together match 34 titles, all of
  them real, and 14 of those carry no `Deprecations` tag.
*/
const DEPRECATION_ANYWHERE = /\b(removed|removal|deprecat\w*)(?![\w-])/i;
const REMOVAL_LEADING = /^remove[sd]?\b/i;

/** The changelog tag that marks a deprecation or a removal. */
export const DEPRECATION_TAG = 'Deprecations';

/**
 * Whether a change is one an upgrade has to be read for, rather than a feature
 * that simply appears.
 *
 * The `Deprecations` tag is the signal, and the title is a fallback because the
 * tag is applied by hand and has been missed: 14 deprecations and removals carry
 * a product tag instead. Neither can hide a change — every entry in a
 * release's window is listed either way — so the fallback only decides whether a
 * removal appears above the feature list or inside it, and reading a feature as a
 * removal costs nothing next to the reverse.
 *
 * Changelog entries are generated outside this repository and must not be edited
 * here, which is why the classification lives on this side.
 */
export function isUpgradeRelevant(change: { title: string; tags: string[] }): boolean {
  const title = change.title.trim();
  return (
    change.tags.includes(DEPRECATION_TAG) ||
    DEPRECATION_ANYWHERE.test(title) ||
    REMOVAL_LEADING.test(title)
  );
}

/** Human-readable release date, e.g. `11 September 2026`. Formatted in UTC. */
export function formatReleaseDate(releasedAt: string): string {
  return new Date(releasedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** ISO `YYYY-MM-DD` for a `<time datetime>` attribute. */
export function formatReleaseDateISO(releasedAt: string): string {
  return new Date(releasedAt).toISOString().slice(0, 10);
}
