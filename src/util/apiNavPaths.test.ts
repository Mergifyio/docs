import { describe, expect, it } from 'vitest';
import type { OpenAPISpec } from '~/components/ApiReference/openapi';
import apiSchema from '../../public/api-schemas.json';
import { danglingApiNavPaths } from './apiNavPaths';

const schema = apiSchema as unknown as OpenAPISpec;

/** The spec with `from` renamed to `to` wherever an operation is tagged with it. */
function renameTag(from: string, to: string): OpenAPISpec {
  const renamed = structuredClone(schema);
  for (const pathItem of Object.values(renamed.paths)) {
    for (const operation of Object.values(pathItem)) {
      if (Array.isArray(operation?.tags)) {
        operation.tags = operation.tags.map((tag) => (tag === from ? to : tag));
      }
    }
  }
  return renamed;
}

describe('danglingApiNavPaths', () => {
  it('accepts the sidebar as it stands', () => {
    expect(danglingApiNavPaths(schema)).toEqual([]);
  });

  // The regression: a tag rename in a synced spec deletes the route the
  // sidebar points at, and every page of the site carries that link.
  it('reports a nav path whose tag is gone from the spec', () => {
    expect(danglingApiNavPaths(renameTag('activity_log', 'eventlogs'))).toEqual([
      '/api/activity-log',
    ]);
  });

  // /api/usage is src/content/docs/api/usage.mdx. It has no tag behind it, so
  // it is only ever accepted by the hand-written half of the check — which
  // makes this the case that fails if that half breaks.
  it('accepts a hand-written page with no tag behind it', () => {
    expect(danglingApiNavPaths(renameTag('activity_log', 'eventlogs'))).not.toContain('/api/usage');
    // Every tag gone: only the hand-written page and the index may survive.
    const untagged = structuredClone(schema);
    for (const pathItem of Object.values(untagged.paths)) {
      for (const operation of Object.values(pathItem)) {
        if (Array.isArray(operation?.tags)) operation.tags = [];
      }
    }
    expect(danglingApiNavPaths(untagged)).not.toContain('/api/usage');
  });

  // navItems already ships anchored entries elsewhere
  // (/test-insights#test-framework-configuration), and the /api pages are the
  // ones with a heading per endpoint, so anchoring one is the natural next
  // edit. Reading the anchor as part of the slug would fail the deploy build
  // on a link that resolves.
  it('resolves an anchored or queried nav path against the page it points at', () => {
    const nav = [
      { title: 'Anchored tag page', path: '/api/activity-log#list-events' },
      { title: 'Anchored hand-written page', path: '/api/usage?utm=nav' },
    ];
    expect(danglingApiNavPaths(schema, nav)).toEqual([]);
  });

  it('accepts both spellings of the reference index', () => {
    const nav = [
      { title: 'Reference', path: '/api/' },
      { title: 'Reference, no slash', path: '/api' },
    ];
    expect(danglingApiNavPaths(schema, nav)).toEqual([]);
  });
});
