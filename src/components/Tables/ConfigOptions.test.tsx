import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getValueTypeText } from '~/util/schemaToMarkdown';
import { getValueType } from './ConfigOptions';

// The x-has-data-type contract, render side: a node flagged as a documented data
// type becomes a link to its data-types section instead of an expansion of
// its shape, for both the HTML tables (getValueType) and the markdown/LLM
// export (getValueTypeText). The node's `title` drives the label and the
// anchor (slugified title). The flag may sit inline or beside a `$ref`
// (pydantic's shape for types hoisted into $defs, where the title lives on
// the $defs target). dataType.test.ts covers the page side (title↔anchor).

const HREF = '/configuration/data-types#queue-dequeue-reason';

const inlineMarked = {
  title: 'Queue dequeue reason',
  'x-has-data-type': true,
  anyOf: [{ enum: ['PR_MERGED', 'PR_DEQUEUED'], type: 'string' }, { type: 'null' }],
};

function render(schema: object, definition: object): string {
  const element = getValueType(schema, definition);
  return element === null ? '' : renderToStaticMarkup(element);
}

describe('getValueType with x-has-data-type', () => {
  it('links an inline-flagged node instead of expanding its enum', () => {
    const html = render({}, inlineMarked);
    expect(html).toContain(`href="${HREF}"`);
    expect(html).toContain('Queue dequeue reason');
    expect(html).not.toContain('PR_MERGED');
  });

  it('links a flag published as a $ref sibling, taking the title from the target', () => {
    const schema = { $defs: { QueueCode: { title: 'Queue dequeue reason', type: 'string' } } };
    const html = render(schema, { $ref: '#/$defs/QueueCode', 'x-has-data-type': true });
    expect(html).toContain(`href="${HREF}"`);
    expect(html).toContain('Queue dequeue reason');
  });

  it('links a flag on a $defs entry reached through a plain $ref', () => {
    const schema = {
      $defs: {
        QueueCode: { 'x-has-data-type': true, title: 'Queue dequeue reason', type: 'string' },
      },
    };
    const html = render(schema, { $ref: '#/$defs/QueueCode' });
    expect(html).toContain(`href="${HREF}"`);
  });

  it('renders "list of" around $ref items pointing at a flagged $defs entry', () => {
    const schema = {
      $defs: {
        ReportMode: {
          'x-has-data-type': true,
          title: 'Report Modes',
          enum: ['check', 'comment'],
          type: 'string',
        },
      },
    };
    const html = render(schema, { type: 'array', items: { $ref: '#/$defs/ReportMode' } });
    expect(html).toContain('list of');
    expect(html).toContain('href="/configuration/data-types#report-modes"');
    expect(html).toContain('Report Modes');
    expect(html).not.toContain('check');
  });

  it('falls back to the previous rendering when a flagged node has no title', () => {
    const html = render({}, { 'x-has-data-type': true, enum: ['check', 'comment'] });
    expect(html).not.toContain('href');
    expect(html).toContain('check');
  });

  it('does not crash on a dangling $ref', () => {
    expect(() => render({ $defs: {} }, { $ref: '#/$defs/Gone' })).not.toThrow();
  });

  it('still expands unmarked enums', () => {
    const html = render({}, { enum: ['check', 'comment'] });
    expect(html).toContain('check');
    expect(html).toContain('comment');
  });
});

describe('getValueTypeText with x-has-data-type', () => {
  it('emits a markdown link instead of the enum dump', () => {
    expect(getValueTypeText({} as never, inlineMarked)).toBe(`[Queue dequeue reason](${HREF})`);
  });

  it('emits "list of" around $ref items pointing at a flagged $defs entry', () => {
    const schema = {
      $defs: {
        ReportMode: {
          'x-has-data-type': true,
          title: 'Report Modes',
          enum: ['check', 'comment'],
          type: 'string',
        },
      },
    };
    expect(
      getValueTypeText(schema as never, { type: 'array', items: { $ref: '#/$defs/ReportMode' } })
    ).toBe('list of [Report Modes](/configuration/data-types#report-modes)');
  });

  it('still expands unmarked enums', () => {
    expect(getValueTypeText({} as never, { enum: ['check', 'comment'] })).toBe(
      '`check` or `comment`'
    );
  });
});
