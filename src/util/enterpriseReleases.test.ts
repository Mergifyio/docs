import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import enterpriseReleases from '../data/enterprise-releases.json';
import {
  buildReleaseTimeline,
  compareVersions,
  type EnterpriseRelease,
  findOutOfOrderReleases,
  formatReleaseDate,
  formatReleaseDateISO,
  isUpgradeRelevant,
  parseVersion,
  selectWindowEntries,
} from './enterpriseReleases';

const versionOf = (timeline: { version: string }[]) => timeline.map((entry) => entry.version);

describe('parseVersion', () => {
  test('parses a three-part version', () => {
    expect(parseVersion('8.17.2')).toEqual({ major: 8, minor: 17, patch: 2 });
  });

  test('tolerates surrounding whitespace', () => {
    expect(parseVersion(' 8.0.0 ')).toEqual({ major: 8, minor: 0, patch: 0 });
  });

  test('rejects anything that is not three numeric parts', () => {
    expect(parseVersion('8.17')).toBeNull();
    expect(parseVersion('8.17.2-rc1')).toBeNull();
    expect(parseVersion('dev')).toBeNull();
    expect(parseVersion('')).toBeNull();
  });
});

describe('compareVersions', () => {
  test('orders by minor numerically, not lexicographically', () => {
    const nine = parseVersion('8.9.0')!;
    const ten = parseVersion('8.10.1')!;
    expect(compareVersions(nine, ten)).toBeLessThan(0);
  });

  test('orders by patch within a line', () => {
    expect(compareVersions(parseVersion('8.4.1')!, parseVersion('8.4.3')!)).toBeLessThan(0);
  });
});

describe('buildReleaseTimeline', () => {
  test('returns releases newest first', () => {
    const timeline = buildReleaseTimeline([
      { version: '8.1.0', releasedAt: '2024-02-07 14:46:38 +0000' },
      { version: '8.0.0', releasedAt: '2023-11-30 14:40:47 +0000' },
    ]);
    expect(versionOf(timeline)).toEqual(['8.1.0', '8.0.0']);
  });

  test('classifies X.0.0 as major, a line opener as minor, a later tag as patch', () => {
    const timeline = buildReleaseTimeline([
      { version: '8.0.0', releasedAt: '2023-11-30 14:40:47 +0000' },
      { version: '8.4.0', releasedAt: '2024-09-11 08:18:28 +0000' },
      { version: '8.4.1', releasedAt: '2024-10-15 13:01:03 +0200' },
    ]);
    expect(timeline.map((entry) => [entry.version, entry.kind])).toEqual([
      ['8.4.1', 'patch'],
      ['8.4.0', 'minor'],
      ['8.0.0', 'major'],
    ]);
  });

  test('treats the first tag of a line as its opener even when the patch is not zero', () => {
    // 8.10.0 was never tagged, so 8.10.1 opens the 8.10 line and gets its window.
    // It is still labelled a patch: the badge sits beside the version string and
    // has to agree with it, so the window and the label are read off different
    // things on purpose.
    const timeline = buildReleaseTimeline([
      { version: '8.9.0', releasedAt: '2025-08-26 14:33:24 +0000' },
      { version: '8.10.1', releasedAt: '2025-10-23 13:11:05 +0000' },
    ]);
    const tenOne = timeline.find((entry) => entry.version === '8.10.1')!;
    expect(tenOne.kind).toBe('patch');
    expect(tenOne.changeWindow).toEqual({
      from: '2025-08-26 14:33:24 +0000',
      to: '2025-10-23 13:11:05 +0000',
    });
  });

  test('gives a patch release no change window', () => {
    const timeline = buildReleaseTimeline([
      { version: '8.17.0', releasedAt: '2026-07-30 09:01:22 +0000' },
      { version: '8.17.1', releasedAt: '2026-08-18 21:48:07 +0200' },
    ]);
    expect(timeline.find((entry) => entry.version === '8.17.1')!.changeWindow).toBeNull();
  });

  test('leaves the oldest release on record with an open-ended window', () => {
    const timeline = buildReleaseTimeline([
      { version: '8.0.0', releasedAt: '2023-11-30 14:40:47 +0000' },
    ]);
    expect(timeline[0].changeWindow).toEqual({ from: null, to: '2023-11-30 14:40:47 +0000' });
  });

  test('bounds a window by the semver predecessor, not the most recent date', () => {
    // 8.4.2 and 8.4.3 were tagged after 8.5.0. Ordering by date would make one of
    // them 8.6.0's lower bound and lose everything announced between the two.
    const timeline = buildReleaseTimeline([
      { version: '8.4.0', releasedAt: '2024-09-11 08:18:28 +0000' },
      { version: '8.5.0', releasedAt: '2024-10-21 13:46:55 +0000' },
      { version: '8.4.2', releasedAt: '2024-10-21 18:36:17 +0200' },
      { version: '8.4.3', releasedAt: '2024-10-29 18:16:26 +0100' },
      { version: '8.6.0', releasedAt: '2025-02-11 10:47:04 +0100' },
    ]);
    expect(timeline.find((entry) => entry.version === '8.6.0')!.changeWindow).toEqual({
      from: '2024-10-21 13:46:55 +0000',
      to: '2025-02-11 10:47:04 +0100',
    });
  });

  test('keeps releases below minMajor as boundaries without returning them', () => {
    const timeline = buildReleaseTimeline(
      [
        { version: '7.7.0', releasedAt: '2023-10-26 08:04:07 +0000' },
        { version: '8.0.0', releasedAt: '2023-11-30 14:40:47 +0000' },
      ],
      { minMajor: 8 }
    );
    expect(versionOf(timeline)).toEqual(['8.0.0']);
    expect(timeline[0].changeWindow).toEqual({
      from: '2023-10-26 08:04:07 +0000',
      to: '2023-11-30 14:40:47 +0000',
    });
  });

  test('ignores versions that are not plain semver', () => {
    const timeline = buildReleaseTimeline([
      { version: 'dev', releasedAt: '2026-01-01 00:00:00 +0000' },
      { version: '8.0.0', releasedAt: '2023-11-30 14:40:47 +0000' },
    ]);
    expect(versionOf(timeline)).toEqual(['8.0.0']);
  });
});

describe('findOutOfOrderReleases', () => {
  test('flags a line opener that is not newer than the one below it', () => {
    expect(
      findOutOfOrderReleases([
        { version: '8.1.0', releasedAt: '2024-02-07 14:46:38 +0000' },
        { version: '8.2.0', releasedAt: '2024-01-01 00:00:00 +0000' },
      ])
    ).toEqual(['8.2.0']);
  });

  test('accepts a patch tagged after the line that superseded it', () => {
    expect(
      findOutOfOrderReleases([
        { version: '8.4.0', releasedAt: '2024-09-11 08:18:28 +0000' },
        { version: '8.5.0', releasedAt: '2024-10-21 13:46:55 +0000' },
        { version: '8.4.2', releasedAt: '2024-10-21 18:36:17 +0200' },
      ])
    ).toEqual([]);
  });

  test('every shipped release is in order', () => {
    // Guards the derivation itself: a release list whose line openers are not
    // chronological hands a release an empty window rather than failing, so the
    // build has to be what notices.
    expect(findOutOfOrderReleases(enterpriseReleases as EnterpriseRelease[])).toEqual([]);
  });
});

describe('selectWindowEntries', () => {
  // 8.16.0 was tagged 2026-06-09 and 8.17.0 on 2026-07-30, the two bounds below.
  const entries = [
    { id: 'before-8.16.0', date: '2026-06-01' },
    { id: 'day-of-8.16.0', date: '2026-06-09' },
    { id: 'between', date: '2026-07-01' },
    { id: 'day-of-8.17.0', date: '2026-07-30' },
    { id: 'after-8.17.0', date: '2026-08-01' },
  ];
  const window = { from: '2026-06-09 14:59:23 +0000', to: '2026-07-30 09:01:22 +0000' };

  test('includes entries announced up to and including the tag date', () => {
    expect(selectWindowEntries(entries, window).map((entry) => entry.id)).toEqual([
      'between',
      'day-of-8.17.0',
    ]);
  });

  test('counts an entry announced on a tag date exactly once', () => {
    // A changelog date is UTC midnight and a tag never is, so an entry announced
    // on the day of a tag sits below that tag's upper bound and below the next
    // release's lower bound: it lands in the earlier window and nowhere else.
    const earlier = { from: '2026-04-28 13:24:45 +0000', to: '2026-06-09 14:59:23 +0000' };
    const inEarlier = selectWindowEntries(entries, earlier).map((entry) => entry.id);
    const inLater = selectWindowEntries(entries, window).map((entry) => entry.id);
    expect(inEarlier).toContain('day-of-8.16.0');
    expect(inLater).not.toContain('day-of-8.16.0');
    expect(inEarlier.filter((id) => inLater.includes(id))).toEqual([]);
  });

  test('takes everything up to the tag when there is no lower bound', () => {
    expect(
      selectWindowEntries(entries, { from: null, to: '2026-07-01 00:00:00 +0000' }).map(
        (entry) => entry.id
      )
    ).toEqual(['before-8.16.0', 'day-of-8.16.0', 'between']);
  });

  test('returns nothing for a patch release', () => {
    expect(selectWindowEntries(entries, null)).toEqual([]);
  });

  test('accepts Date objects as well as strings', () => {
    const dated = [{ id: 'dated', date: new Date('2026-07-01T00:00:00Z') }];
    expect(selectWindowEntries(dated, window).map((entry) => entry.id)).toEqual(['dated']);
  });
});

describe('isUpgradeRelevant', () => {
  test('takes the Deprecations tag', () => {
    expect(
      isUpgradeRelevant({ title: 'Removal of queue freeze attributes', tags: ['Deprecations'] })
    ).toBe(true);
  });

  test('takes a removal the tag missed', () => {
    expect(
      isUpgradeRelevant({ title: '`unqueue` command alias removed', tags: ['Workflow Automation'] })
    ).toBe(true);
  });

  test('leaves a feature alone', () => {
    expect(isUpgradeRelevant({ title: 'Isolated merge queue mode', tags: ['Merge Queue'] })).toBe(
      false
    );
  });

  test('does not read an identifier containing "removed" as a removal', () => {
    expect(
      isUpgradeRelevant({ title: 'Add added/modified/removed-files attributes', tags: ['Rules'] })
    ).toBe(false);
  });

  test('takes a deprecation the tag missed', () => {
    expect(
      isUpgradeRelevant({ title: 'Partition rules are now deprecated', tags: ['Merge Queue'] })
    ).toBe(true);
  });

  test('takes a removal announced in the imperative', () => {
    expect(
      isUpgradeRelevant({ title: 'Remove deprecated options of `queue` action', tags: ['Rules'] })
    ).toBe(true);
  });

  test('does not read "remove" as a removal in the middle of a feature title', () => {
    // The one title in the changelog that says `remove` and announces a feature.
    expect(
      isUpgradeRelevant({
        title: 'Add/remove `queued` label automatically on PRs',
        tags: ['Merge Queue'],
      })
    ).toBe(false);
  });

  test('sorts every shape the changelog actually uses', () => {
    // Both halves matter: a title rule that fires on features would promote them
    // above the deprecations, and the tag alone misses 14 of these.
    const cases: [string, string[], boolean][] = [
      ['`strict` mode removed', ['Deprecations'], true],
      ['Repository badge API removed', ['API'], true],
      ['`priority_rules` from `queue_rules` removal', ['Merge Queue'], true],
      ['Deprecation of `post_check` action', ['Deprecations'], true],
      ['`autosquash` has been deprecated', ['Merge Queue'], true],
      ['Add added/modified/removed-files attributes', ['Rules'], false],
      ['Add/remove `queued` label automatically on PRs', ['Merge Queue'], false],
      ['Merge queues use an automatic checks timeout by default', ['Merge Queue'], false],
    ];
    expect(
      cases.map(([title, tags]) => [title, isUpgradeRelevant({ title, tags })] as const)
    ).toEqual(cases.map(([title, , expected]) => [title, expected]));
  });
});

describe('the release notes collection', () => {
  // The notes are keyed on a version string with nothing to join it to at build
  // time: a typo renders no notes at all rather than failing, and the release it
  // was written for loses its upgrade steps silently.
  const notesDir = new URL('../content/enterpriseReleaseNotes/', import.meta.url);

  const noteVersions = readdirSync(fileURLToPath(notesDir))
    .filter((name) => name.endsWith('.mdx'))
    .map((name) => {
      const source = readFileSync(fileURLToPath(new URL(name, notesDir)), 'utf-8');
      const version = /^version:\s*'([^']+)'\s*$/m.exec(source)?.[1];
      return { name, version };
    });

  test('there is at least one note to check', () => {
    expect(noteVersions.length).toBeGreaterThan(0);
  });

  test('every note declares a version', () => {
    expect(noteVersions.filter((note) => !note.version).map((note) => note.name)).toEqual([]);
  });

  test('every note is named after the version it declares', () => {
    const mismatched = noteVersions
      .filter((note) => note.version && note.name !== `${note.version}.mdx`)
      .map((note) => note.name);
    expect(mismatched).toEqual([]);
  });

  test('every note matches a released version', () => {
    const released = new Set(
      (enterpriseReleases as EnterpriseRelease[]).map((release) => release.version)
    );
    const unknown = noteVersions
      .filter((note) => note.version && !released.has(note.version))
      .map((note) => note.version);
    expect(unknown).toEqual([]);
  });
});

describe('date formatting', () => {
  test('renders a release date in UTC', () => {
    expect(formatReleaseDate('2026-09-11 17:37:54 +0200')).toBe('11 September 2026');
  });

  test('renders an ISO day for the datetime attribute', () => {
    expect(formatReleaseDateISO('2026-09-11 17:37:54 +0200')).toBe('2026-09-11');
  });
});
