import { describe, expect, test } from 'vitest';
import navItems from '../content/navItems';
import { getActivePageGroupIds } from './activePageGroupIds';

const findGroupId = (title: string, items = navItems): string | undefined => {
  for (const item of items) {
    if (item.title === title && item.id) return item.id;
    if (item.children) {
      const found = findGroupId(title, item.children);
      if (found) return found;
    }
  }
  return undefined;
};

describe('getActivePageGroupIds', () => {
  test('returns empty for the homepage (no parent group)', () => {
    expect(getActivePageGroupIds('/')).toEqual([]);
  });

  test('returns empty for an unknown path', () => {
    expect(getActivePageGroupIds('/does-not-exist')).toEqual([]);
  });

  test('returns the parent group for a single-level page', () => {
    const stacksId = findGroupId('Stacks');
    expect(stacksId).toBeDefined();
    expect(getActivePageGroupIds('/stacks/setup/')).toEqual([stacksId]);
  });

  test('handles paths without a trailing slash', () => {
    const stacksId = findGroupId('Stacks');
    expect(getActivePageGroupIds('/stacks/setup')).toEqual([stacksId]);
  });

  test('returns ancestors in outer-to-inner order for nested pages', () => {
    const stacksId = findGroupId('Stacks');
    const compareId = findGroupId('Compare Tools');
    expect(stacksId).toBeDefined();
    expect(compareId).toBeDefined();
    expect(getActivePageGroupIds('/stacks/compare/gh-stack')).toEqual([stacksId, compareId]);
  });

  test('matches a leaf with the same path as its parent group (overview)', () => {
    const stacksId = findGroupId('Stacks');
    expect(getActivePageGroupIds('/stacks')).toEqual([stacksId]);
  });

  test('matches a group whose own path has no leaf child (top-level)', () => {
    // Integrations group has path "/integrations" but its children are all
    // distinct pages (/integrations/github, etc.) — no leaf for /integrations
    // itself. The group should still be included in the open set.
    const integrationsId = findGroupId('Integrations');
    expect(integrationsId).toBeDefined();
    expect(getActivePageGroupIds('/integrations')).toEqual([integrationsId]);
  });

  test('matches a nested group whose own path has no leaf child', () => {
    // Workflow Automation > Actions group has path "/workflow/actions" with
    // children like "/workflow/actions/assign", and no leaf for "/workflow/actions".
    const workflowId = findGroupId('Workflow Automation');
    const actionsId = findGroupId('Actions');
    expect(workflowId).toBeDefined();
    expect(actionsId).toBeDefined();
    expect(getActivePageGroupIds('/workflow/actions')).toEqual([workflowId, actionsId]);
  });

  test('still prefers a deeper leaf match over the enclosing group', () => {
    // Sanity check: on /workflow/actions/assign we want both ancestor groups,
    // matched via the leaf — not the Actions group's own path.
    const workflowId = findGroupId('Workflow Automation');
    const actionsId = findGroupId('Actions');
    expect(getActivePageGroupIds('/workflow/actions/assign')).toEqual([workflowId, actionsId]);
  });
});
