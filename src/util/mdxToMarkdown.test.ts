import { describe, expect, test } from 'vitest';
import { mdxToMarkdown } from './mdxToMarkdown';

describe('mdxToMarkdown', () => {
  test('should strip import statements', () => {
    const input = `---
title: Test
---

import MyComponent from '~/components/MyComponent';
import { something } from 'some-lib';

# Hello

Some content.
`;
    const result = mdxToMarkdown(input);
    expect(result).not.toContain('import MyComponent');
    expect(result).not.toContain('import { something }');
    expect(result).toContain('# Hello');
    expect(result).toContain('Some content.');
  });

  test('should expand OptionsTable with a known def', () => {
    const input = `# Config

<OptionsTable def="CloseActionModel" />
`;
    const result = mdxToMarkdown(input);
    expect(result).not.toContain('<OptionsTable');
    expect(result).toContain('Key name');
    expect(result).toContain('Value type');
    expect(result).toContain('Description');
    expect(result).toContain('`message`');
  });

  test('should expand ActionOptionsTable with a known def', () => {
    const input = `<ActionOptionsTable def="CloseActionModel" />`;
    const result = mdxToMarkdown(input);
    expect(result).not.toContain('<ActionOptionsTable');
    expect(result).toContain('Key name');
    expect(result).toContain('`message`');
  });

  test('should expand PullRequestAttributesTable', () => {
    const input = `# Conditions

<PullRequestAttributesTable />
`;
    const result = mdxToMarkdown(input);
    expect(result).not.toContain('<PullRequestAttributesTable');
    expect(result).toContain('Attribute name');
    expect(result).toContain('Value type');
    expect(result).toContain('Description');
  });

  test('should handle single-quoted def attribute', () => {
    const input = `<ActionOptionsTable def='CloseActionModel'/>`;
    const result = mdxToMarkdown(input);
    expect(result).not.toContain('<ActionOptionsTable');
    expect(result).toContain('`message`');
  });

  test('should strip remaining self-closing JSX components', () => {
    const input = `# Page

<DocsetGrid category="merge-queue" />

Some text.
`;
    const result = mdxToMarkdown(input);
    expect(result).not.toContain('<DocsetGrid');
    expect(result).toContain('Some text.');
  });

  test('should strip wrapping JSX components but keep inner content', () => {
    const input = `<Aside type="note">
  Important info here.
</Aside>`;
    const result = mdxToMarkdown(input);
    expect(result).not.toContain('<Aside');
    expect(result).not.toContain('</Aside>');
    expect(result).toContain('Important info here.');
  });

  test('should strip nested JSX components', () => {
    const input = `<DocsetGrid>
  <Docset title="Backport" path="backport">
    Copy a pull request to another branch.
  </Docset>
  <Docset title="Queue" path="queue">
    Add a pull request to a merge queue.
  </Docset>
</DocsetGrid>`;
    const result = mdxToMarkdown(input);
    expect(result).not.toContain('<DocsetGrid');
    expect(result).not.toContain('<Docset');
    expect(result).not.toContain('</Docset>');
    expect(result).toContain('Copy a pull request to another branch.');
    expect(result).toContain('Add a pull request to a merge queue.');
  });

  test('should preserve frontmatter', () => {
    const input = `---
title: My Page
description: A test page
---

# Content
`;
    const result = mdxToMarkdown(input);
    expect(result).toContain('title: My Page');
    expect(result).toContain('description: A test page');
  });

  test('should collapse excessive blank lines', () => {
    const input = `# Title



\n\n\n

Content here.
`;
    const result = mdxToMarkdown(input);
    // Should not have more than 2 consecutive newlines
    expect(result).not.toMatch(/\n{3,}/);
  });

  test('should handle unknown def gracefully', () => {
    const input = `<OptionsTable def="NonExistentDef" />`;
    const result = mdxToMarkdown(input);
    expect(result).toContain('<!-- Unknown definition: NonExistentDef -->');
  });

  test('should produce a default column when defaults exist', () => {
    // BackportActionModel has defaults like ignore_conflicts: true
    const input = `<OptionsTable def="BackportActionModel" />`;
    const result = mdxToMarkdown(input);
    expect(result).toContain('Default');
  });
});
