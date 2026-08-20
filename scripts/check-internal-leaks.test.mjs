import { describe, expect, it } from 'vitest';
import { iterFiles, scanFile, scanText } from './check-internal-leaks.mjs';

const rulesOf = (text) => scanText(text).map((f) => f.rule);

describe('scanText', () => {
  it('catches support ticket and thread identifiers', () => {
    expect(rulesOf('See ticket T-1234 for details.')).toEqual(['support-ticket']);
    expect(rulesOf('thread th_01JQZK4M8XN2VR7TDY0P3WGA6H')).toEqual(['support-ticket']);
    expect(rulesOf('https://app.plain.com/workspace/x')).toEqual(['support-ticket']);
  });

  it('catches bare tracker ticket references', () => {
    expect(rulesOf('Tracked in MRGFY-1234.')).toEqual(['ticket-ref']);
    // The form that reached the public site: inside a CLI example, where it
    // reads as a plausible value rather than as a leak.
    expect(rulesOf('mergify tests quarantines add --reason "flaky, see MRGFY-1234"')).toEqual([
      'ticket-ref',
    ]);
    // The branch-name spelling of the same key.
    expect(rulesOf('git checkout devs/jd/mrgfy-8721-fix-the-thing')).toEqual(['ticket-ref']);
    expect(rulesOf('helpdesk HD-18')).toEqual(['ticket-ref']);
    // A tracker URL leaks twice over; both rules report it.
    expect(rulesOf('https://linear.app/mergify/issue/MRGFY-1234')).toEqual([
      'ticket-ref',
      'internal-tracker',
    ]);
  });

  it('leaves example values that look like ticket keys alone', () => {
    expect(rulesOf('encrypted with AES-256 and served as UTF-8')).toEqual([]);
    expect(rulesOf('meets WCAG-2 contrast, over HTTP-2, dated 2026-07')).toEqual([]);
    // Another tracker's keys are the reader's own, not ours.
    expect(rulesOf('a Jira key such as PROJ-42 or ABC-7')).toEqual([]);
    // Lowercase two-letter keys are indistinguishable from slug fragments.
    expect(rulesOf('![diagram](./queue-hd-2.png)')).toEqual([]);
  });

  it('catches private repositories and internal source paths', () => {
    expect(rulesOf('mergify_shadow_office/models/billing.py')).toEqual(['internal-source-path']);
    expect(rulesOf('cloned from Mergifyio/monorepo')).toEqual(['internal-source-path']);
    expect(rulesOf('engine/mergify_engine/rules/config.py')).toEqual(['internal-source-path']);
  });

  it('catches internal trackers and hostnames', () => {
    expect(rulesOf('https://linear.app/mergifyio/issue/1')).toEqual(['internal-tracker']);
    expect(rulesOf('https://www.notion.so/mergify/runbook')).toEqual(['internal-tracker']);
    expect(rulesOf('https://admin.mergify.com/orgs')).toEqual(['internal-host']);
  });

  it('leaves public Mergify and third-party references alone', () => {
    expect(rulesOf('https://github.com/Mergifyio/mergify/discussions')).toEqual([]);
    expect(rulesOf('the `mergifyio/gha-mergify-ci` action')).toEqual([]);
    expect(rulesOf('https://dashboard.mergify.com/ci-insights')).toEqual([]);
    expect(rulesOf('https://app.datadoghq.com/integrations?search=mergify')).toEqual([]);
    expect(rulesOf('owner: my-org\nrepository: your-repo')).toEqual([]);
    // The docs document token prefixes as placeholders; those must not fire.
    expect(rulesOf('Use a classic `ghp_*` or fine-grained `github_pat_*` token.')).toEqual([]);
    expect(rulesOf('Authorization: Bearer <your-token>')).toEqual([]);
  });

  it('reports the line number and the matched text', () => {
    const findings = scanText('intro\n\nsee T-1234 now\n');
    expect(findings).toEqual([
      { line: 3, rule: 'support-ticket', label: 'support ticket or thread ID', match: 'T-1234' },
    ]);
  });

  it('honors an allow directive naming the rule on the previous line', () => {
    expect(rulesOf('{/* internal-leaks: allow support-ticket — public */}\nT-1234\n')).toEqual([]);
    expect(rulesOf('# internal-leaks: allow internal-tracker — public\nlinear.app/x\n')).toEqual(
      []
    );
    // The directive is scoped: it only allows the rule it names.
    expect(rulesOf('{/* internal-leaks: allow internal-tracker */}\nT-1234\n')).toEqual([
      'support-ticket',
    ]);
    // ...and only the next non-blank line.
    expect(rulesOf('{/* internal-leaks: allow support-ticket */}\nfine\nT-1234\n')).toEqual([
      'support-ticket',
    ]);
    // A line that trips two rules needs both named, so the directive takes a
    // comma-separated list.
    expect(
      rulesOf(
        '{/* internal-leaks: allow ticket-ref, internal-tracker — public */}\nMRGFY-1 at linear.app/x\n'
      )
    ).toEqual([]);
    // The reason is prose: its words are not read as further rule ids.
    expect(rulesOf('# internal-leaks: allow internal-tracker support-ticket\nT-1234\n')).toEqual([
      'support-ticket',
    ]);
  });
});

describe('published docs', () => {
  it('contain no internal information', () => {
    const findings = [];
    let scanned = 0;
    for (const file of iterFiles(['src/content/docs'])) {
      scanned += 1;
      findings.push(...scanFile(file));
    }
    if (findings.length) {
      const detail = findings
        .map((f) => `${f.file}:${f.line} — ${f.label} — ${f.match}`)
        .join('\n');
      throw new Error(`Internal information found in published docs:\n${detail}`);
    }
    // Sanity: the scan actually walked the docs tree.
    expect(scanned).toBeGreaterThan(50);
  });
});
