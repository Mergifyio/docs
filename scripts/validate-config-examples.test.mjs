import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  classify,
  createValidator,
  extractFromFile,
  findQuotedPatterns,
  iterMdx,
  validateBlocks,
} from './validate-config-examples.mjs';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

describe('classify', () => {
  it('recognizes a complete Mergify config', () => {
    expect(classify('queue_rules:\n  - name: default\n')).toBe('mergify-config');
    expect(classify('scopes:\n  source:\n    files: {}\n')).toBe('mergify-config');
    expect(classify('merge_protections_settings:\n  foo: bar\n')).toBe('mergify-config');
  });

  it('treats fragments and placeholders as partial', () => {
    expect(classify('- name: a rule\n  conditions: []\n')).toBe('partial');
    expect(classify('queue_rules:\n  - name: default\n    ...\n')).toBe('partial');
    expect(classify('# partial\nconditions:\n  - base=main\n')).toBe('partial');
  });

  it('detects GitHub Actions workflows', () => {
    expect(classify('on:\n  push:\njobs:\n  build:\n    runs-on: ubuntu-latest\n')).toBe(
      'github-actions'
    );
  });
});

describe('validateBlocks', () => {
  const validate = createValidator();

  it('rejects a config with an unknown key (not a no-op)', () => {
    const blocks = [
      {
        file: 'x.mdx',
        line: 1,
        classification: 'mergify-config',
        code: 'queue_rules:\n  - name: d\n    bogus_key: 5\n',
      },
    ];
    const failures = validateBlocks(blocks, validate);
    expect(failures).toHaveLength(1);
    expect(failures[0].msg).toMatch(/additional properties|bogus_key/i);
  });

  it('accepts a valid config and a Mergify human duration', () => {
    const blocks = [
      {
        file: 'x.mdx',
        line: 1,
        classification: 'mergify-config',
        code: 'queue_rules:\n  - name: default\n    checks_timeout: 45 min\n',
      },
    ];
    expect(validateBlocks(blocks, validate)).toHaveLength(0);
  });

  it('flags YAML that does not parse (unquoted template needing quotes)', () => {
    const blocks = [
      {
        file: 'x.mdx',
        line: 1,
        classification: 'mergify-config',
        code: 'pull_request_rules:\n  - name: r\n    actions:\n      comment:\n        message: @{{author}} hello\n',
      },
    ];
    const failures = validateBlocks(blocks, validate);
    expect(failures).toHaveLength(1);
    expect(failures[0].msg).toMatch(/invalid YAML/);
  });
});

describe('findQuotedPatterns', () => {
  const block = (code) => [{ file: 'x.mdx', line: 10, classification: 'partial', code }];

  it('flags a regex or glob wrapped in quotes inside an unquoted scalar', () => {
    const failures = findQuotedPatterns(
      block('success_conditions:\n  - files ~= "^ui/"\n  - files *= \'src/**\'\n')
    );
    expect(failures).toHaveLength(2);
    expect(failures[0].line).toBe(12);
    expect(failures[0].msg).toMatch(/never match/);
  });

  it('leaves a condition the author quoted as a whole alone', () => {
    expect(findQuotedPatterns(block('conditions:\n  - "files ~= ^ui/"\n'))).toHaveLength(0);
    expect(findQuotedPatterns(block("conditions:\n  - 'title ~= ^(feat|fix):'\n"))).toHaveLength(0);
  });

  it('leaves quotes that are genuinely part of a pattern alone', () => {
    expect(
      findQuotedPatterns(block('conditions:\n  - title ~= ^Release "v[0-9]+"$\n'))
    ).toHaveLength(0);
    expect(findQuotedPatterns(block('conditions:\n  - title = "release day"\n'))).toHaveLength(0);
  });
});

describe('docs config examples', () => {
  it('all embedded Mergify config examples are valid', () => {
    const blocks = [];
    for (const file of iterMdx(['src/content/docs'])) blocks.push(...extractFromFile(file));
    const failures = [...validateBlocks(blocks), ...findQuotedPatterns(blocks)];
    if (failures.length) {
      const detail = failures.map((f) => `${f.file}:${f.line} — ${f.msg}`).join('\n');
      throw new Error(`Invalid config examples found:\n${detail}`);
    }
    // Sanity: we are actually exercising a meaningful number of configs.
    expect(blocks.filter((b) => b.classification === 'mergify-config').length).toBeGreaterThan(50);
  });

  it('honors the skip directive', () => {
    const blocks = extractFromFile(
      path.join(ROOT, 'src/content/docs/merge-queue/migrate-partitions-to-scopes.mdx')
    );
    expect(blocks.some((b) => b.classification === 'skipped')).toBe(true);
  });
});
