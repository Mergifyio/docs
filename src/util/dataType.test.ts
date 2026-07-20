import { describe, expect, it } from 'vitest';
import configSchema from '../../public/mergify-configuration-schema.json';
import { collectDataTypeTitles, getDataTypeHref, isDataType } from './dataType';
import { dataTypesHeadingAnchors, missingDataTypeAnchors } from './dataTypeAnchors';

describe('isDataType', () => {
  it('recognizes flagged nodes only', () => {
    expect(isDataType({ 'x-has-data-type': true })).toBe(true);
    expect(isDataType({ 'x-has-data-type': 'queue-dequeue-reason' })).toBe(false);
    expect(isDataType({ type: 'string' })).toBe(false);
    expect(isDataType(null)).toBe(false);
    expect(isDataType('string')).toBe(false);
  });
});

describe('getDataTypeHref', () => {
  it('derives the anchor from the title, matching heading slugs regardless of case', () => {
    expect(getDataTypeHref('Queue dequeue reason')).toBe(
      '/configuration/data-types#queue-dequeue-reason'
    );
    expect(getDataTypeHref('Report Modes')).toBe('/configuration/data-types#report-modes');
  });
});

describe('collectDataTypeTitles', () => {
  it('finds flagged nodes wherever they appear in a schema', () => {
    const schema = {
      $defs: {
        ReportMode: { 'x-has-data-type': true, title: 'Report Modes' },
      },
      properties: {
        reason: {
          anyOf: [{ 'x-has-data-type': true, title: 'Queue dequeue reason' }, { type: 'null' }],
        },
        report_mode: { type: 'array', items: { $ref: '#/$defs/ReportMode' } },
        untitled: { 'x-has-data-type': true },
      },
    };
    expect(collectDataTypeTitles(schema).sort()).toEqual([
      'Queue dequeue reason',
      'Report Modes',
      undefined,
    ]);
  });
});

describe('data-types page anchors', () => {
  // Every data-types anchor the site links to — the anchors derived from the
  // engine's marked titles plus the anchors hardcoded in ConfigOptions'
  // legacy link maps. Renaming one of these headings breaks live links even
  // though the build still succeeds, so pin them here.
  it('exposes every anchor the site links to', () => {
    const anchors = dataTypesHeadingAnchors();
    for (const expected of [
      // derived from titles the engine marks with x-has-data-type
      'queue-dequeue-reason',
      'priority',
      'report-modes',
      'schedule',
      // anchors hardcoded in ConfigOptions.tsx link maps
      'commit',
      'commit-author',
      'github-repository-permissions',
      'legacy-template',
      'timestamp',
      'duration',
      'message-template',
      'title-template',
      'body-template',
      'workflow-input-template',
      'user',
      'assignee',
      'bot-account',
    ]) {
      expect(anchors).toContain(expected);
    }
  });

  // The title-derived-anchor convention, checked against the synced schema.
  // The same check gates the deploy build (integrations/validate-data-type-
  // anchors.ts) because schema syncs land as direct pushes to main and never
  // see PR CI; this test surfaces the failure earlier for docs-side edits.
  it('covers every documented data type flagged in the config schema', () => {
    expect(missingDataTypeAnchors(configSchema)).toEqual([]);
  });
});
