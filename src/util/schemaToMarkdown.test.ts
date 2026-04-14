import { describe, expect, test } from 'vitest';
import { expandMdxComponents } from './schemaToMarkdown';

describe('expandMdxComponents', () => {
  test('replaces OptionsTable with a markdown table', () => {
    const input = '<OptionsTable def="PullRequestRuleModel" />';
    const result = expandMdxComponents(input);
    expect(result).toContain('| Key name |');
    expect(result).toContain('| --- |');
    expect(result).toContain('`name`');
    expect(result).toContain('`conditions`');
    expect(result).toContain('`actions`');
    expect(result).not.toContain('OptionsTable');
  });

  test('replaces ActionOptionsTable with a markdown table', () => {
    const input = '<ActionOptionsTable def="BackportActionModel" />';
    const result = expandMdxComponents(input);
    expect(result).toContain('| Key name |');
    expect(result).toContain('`branches`');
    expect(result).not.toContain('ActionOptionsTable');
  });

  test('replaces PullRequestAttributesTable with a markdown table', () => {
    const input = '<PullRequestAttributesTable />';
    const result = expandMdxComponents(input);
    expect(result).toContain('| Attribute name |');
    expect(result).toContain('Value type');
    expect(result).toContain('Description');
    expect(result).not.toContain('PullRequestAttributesTable');
  });

  test('removes import statements', () => {
    const input = [
      'import OptionsTable from "../../../components/Tables/OptionsTable";',
      'import { Image } from "astro:assets"',
      '',
      '# Hello',
      '',
      '<OptionsTable def="PullRequestRuleModel" />',
    ].join('\n');
    const result = expandMdxComponents(input);
    expect(result).not.toContain('import ');
    expect(result).toContain('# Hello');
    expect(result).toContain('| Key name |');
  });

  test('preserves import statements inside fenced code blocks', () => {
    const input = [
      'import Foo from "bar";',
      '',
      '```typescript',
      "import { defineConfig } from 'vitest/config';",
      '',
      'export default defineConfig({});',
      '```',
    ].join('\n');
    const result = expandMdxComponents(input);
    expect(result).not.toContain('import Foo');
    expect(result).toContain("import { defineConfig } from 'vitest/config';");
  });

  test('preserves frontmatter', () => {
    const input = [
      '---',
      'title: Test Page',
      'description: A test',
      '---',
      '',
      'Some content',
    ].join('\n');
    const result = expandMdxComponents(input);
    expect(result).toContain('---');
    expect(result).toContain('title: Test Page');
  });

  test('collapses excessive blank lines', () => {
    const input = 'A\n\n\n\n\nB';
    const result = expandMdxComponents(input);
    expect(result).toBe('A\n\nB');
  });

  test('handles double-quoted and single-quoted def attributes', () => {
    const doubleQuoted = expandMdxComponents('<OptionsTable def="PullRequestRuleModel" />');
    const singleQuoted = expandMdxComponents("<OptionsTable def='PullRequestRuleModel' />");
    expect(doubleQuoted).toBe(singleQuoted);
  });
});
