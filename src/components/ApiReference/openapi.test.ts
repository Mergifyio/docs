import { describe, expect, it } from 'vitest';
import apiSchema from '../../../public/api-schemas.json';
import { getTypeLabel, renderSchemaHtml, resolveRef } from './openapi';

type Spec = Parameters<typeof getTypeLabel>[1];
type Node = Parameters<typeof getTypeLabel>[0];
type RefNode = Parameters<typeof resolveRef>[0];

function parameterNamed(name: string): Node {
  const spec = apiSchema as unknown as {
    paths: Record<string, Record<string, { parameters?: { name: string; schema: unknown }[] }>>;
  };
  const found = Object.values(spec.paths)
    .flatMap((item) => Object.values(item))
    .flatMap((op) => op?.parameters ?? [])
    .find((p) => p.name === name);
  return found?.schema as Node;
}

// Parameters are rendered from `getTypeLabel` alone — no schema tree beneath
// them and no `enum` among their constraints — so whatever it returns is the
// only description of the accepted values a reader gets.
describe('getTypeLabel', () => {
  it('resolves a $ref to an enum into its values', () => {
    expect(getTypeLabel(parameterNamed('source'), apiSchema as unknown as Spec)).toContain(
      '"manual"'
    );
  });

  it('parenthesises a union before the array suffix', () => {
    // `"a" | "b"[]` reads as though only the last member were the array.
    const label = getTypeLabel(parameterNamed('outcome'), apiSchema as unknown as Spec);
    expect(label).toContain('("success"');
    expect(label).toContain('")[]');
  });
});

describe('resolveRef', () => {
  it('does not throw on a component name with a stray percent sign', () => {
    // This runs while rendering every parameter, so an unresolvable ref has
    // to degrade rather than fail the build.
    const root = { components: { schemas: { 'A%B': { enum: ['x'] } } } } as unknown as Spec;
    expect(() => resolveRef({ $ref: '#/components/schemas/A%B' } as RefNode, root)).not.toThrow();
  });

  it('returns the node it was given for a dangling ref', () => {
    const node = { $ref: '#/components/schemas/Nope' } as RefNode;
    expect(resolveRef(node, { components: { schemas: {} } } as unknown as Spec)).toEqual(node);
  });
});

// The engine marks a schema node as a documented data type; on the config side
// `ConfigOptions` turns that into a link. The API reference publishes the same
// marker, so it has to resolve too — otherwise the docs build enforces an
// anchor for a link nothing renders.
describe('documented data type links', () => {
  it('links a marked enum to its data-types section, keeping the values', () => {
    const html = renderSchemaHtml(
      {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            enum: ['running', 'frozen'],
            title: 'Batch Status',
            'x-mergify-has-data-type': true,
          },
        },
      } as never,
      { components: { schemas: {} } } as never
    );
    expect(html).toContain('/configuration/data-types#batch-status');
    expect(html).toContain('Batch Status');
    expect(html).toContain('<code>running</code>');
  });

  it('leaves an unmarked enum alone', () => {
    const html = renderSchemaHtml(
      {
        type: 'object',
        properties: { code: { type: 'string', enum: ['a', 'b'], title: 'Code' } },
      } as never,
      { components: { schemas: {} } } as never
    );
    expect(html).toContain('<code>a</code>');
    expect(html).not.toContain('/configuration/data-types');
  });

  it('finds the marker on a $ref sibling as well as on the target', () => {
    const root = {
      components: {
        schemas: { BatchStatusCode: { type: 'string', enum: ['running'], title: 'Batch Status' } },
      },
    };
    const html = renderSchemaHtml(
      {
        type: 'object',
        properties: {
          code: { $ref: '#/components/schemas/BatchStatusCode', 'x-mergify-has-data-type': true },
        },
      } as never,
      root as never
    );
    expect(html).toContain('/configuration/data-types#batch-status');
  });

  it("renders the real spec's batch status link", () => {
    const spec = apiSchema as never as { components: { schemas: Record<string, unknown> } };
    const html = renderSchemaHtml(spec.components.schemas.BatchStatus as never, apiSchema as never);
    expect(html).toContain('/configuration/data-types#batch-status');
  });
});
