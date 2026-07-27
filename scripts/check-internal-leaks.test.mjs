import { describe, expect, it } from 'vitest';
import { iterFiles, scanFile, scanText } from './check-internal-leaks.mjs';

const rulesOf = (text) => scanText(text).map((f) => f.rule);

describe('scanText', () => {
  it('catches support ticket and thread identifiers', () => {
    expect(rulesOf('See ticket T-1234 for details.')).toEqual(['support-ticket']);
    expect(rulesOf('thread th_01JQZK4M8XN2VR7TDY0P3WGA6H')).toEqual(['support-ticket']);
    expect(rulesOf('https://app.plain.com/workspace/x')).toEqual(['support-ticket']);
  });

  it('catches private repositories and internal source paths', () => {
    expect(rulesOf('mergify_shadow_office/models/billing.py')).toEqual(['internal-source-path']);
    expect(rulesOf('cloned from Mergifyio/monorepo')).toEqual(['internal-source-path']);
    expect(rulesOf('engine/mergify_engine/rules/config.py')).toEqual(['internal-source-path']);
  });

  it('catches internal trackers and hostnames', () => {
    expect(rulesOf('https://linear.app/mergifyio/issue/MRGFY-1')).toEqual(['internal-tracker']);
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
