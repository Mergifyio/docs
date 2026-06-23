import { describe, expect, it } from 'vitest';

import { extractTemplateVariables } from './templateVariables';

describe('extractTemplateVariables', () => {
  it('reads variables from a top-level simple-template field', () => {
    const definition = {
      type: 'string',
      format: 'simple-template',
      'x-mergify-template-variables': [{ name: 'author', description: 'PR author login' }],
    };
    expect(extractTemplateVariables(definition)).toEqual([
      { name: 'author', description: 'PR author login' },
    ]);
  });

  it('finds variables inside an anyOf branch (optional field like comment.message)', () => {
    const definition = {
      anyOf: [
        {
          type: 'string',
          format: 'simple-template',
          'x-mergify-template-variables': [{ name: 'number', description: 'PR number' }],
        },
        { type: 'null' },
      ],
    };
    expect(extractTemplateVariables(definition)).toEqual([
      { name: 'number', description: 'PR number' },
    ]);
  });

  it('finds variables under additionalProperties → anyOf (dict field like github_actions inputs)', () => {
    const definition = {
      type: 'object',
      additionalProperties: {
        anyOf: [
          { type: 'integer' },
          { type: 'boolean' },
          {
            type: 'string',
            format: 'simple-template',
            'x-mergify-template-variables': [{ name: 'base', description: 'base branch' }],
          },
        ],
      },
    };
    expect(extractTemplateVariables(definition)).toEqual([
      { name: 'base', description: 'base branch' },
    ]);
  });

  it('returns [] when no template variables are present', () => {
    expect(extractTemplateVariables({ type: 'string' })).toEqual([]);
    expect(extractTemplateVariables(null)).toEqual([]);
    expect(extractTemplateVariables(undefined)).toEqual([]);
  });
});
