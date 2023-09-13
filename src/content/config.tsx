import { v5 } from 'uuid';

export type NavItem = { title: string, path?: string, children?: NavItem[], id?: string };

const navItems: NavItem[] = [
  { title: 'Home', path: '/' },
  { title: 'Getting Started', path: '/getting-started' },
  {
    title: 'Workflow Automation',
    children: [
      { title: 'Writing Your First Rule', path: '/workflow/writing-your-first-rule' },
      {
        title: 'Use Cases',
        children: [
          { title: 'Automatic Merge', path: '/workflow/automerge' },
        ],
      },
      {
        title: 'Actions',
        children: [
          { title: 'Assign', path: '/workflow/actions/assign' },
          { title: 'Backport', path: '/workflow/actions/backport' },
          { title: 'Close', path: '/workflow/actions/close' },
          { title: 'Comment', path: '/workflow/actions/comment' },
          { title: 'Delete Head Branch', path: '/workflow/actions/delete_head_branch' },
          { title: 'Dismiss Reviews', path: '/workflow/actions/dismiss_reviews' },
          { title: 'Edit', path: '/workflow/actions/edit' },
          { title: '"GitHub Actions', path: '/workflow/actions/github_actions' },
          { title: 'Label', path: '/workflow/actions/label' },
          { title: 'Merge', path: '/workflow/actions/merge' },
          { title: 'Post Check', path: '/workflow/actions/post_check' },
          { title: 'Queue', path: '/workflow/actions/queue' },
          { title: 'Rebase', path: '/workflow/actions/rebase' },
          { title: 'Request Reviews', path: '/workflow/actions/request_reviews' },
          { title: 'Review', path: '/workflow/actions/review' },
          { title: 'Update', path: '/workflow/actions/update' },
          { title: 'Squash', path: '/workflow/actions/squash' },
        ],
      },
    ],
  },
  {
    title: 'Merge Queue',
    children: [
      { title: 'Introduction', path: '/merge-queue/intro' },
      { title: 'Setup', path: '/merge-queue/setup' },
      { title: 'Lifecycle', path: '/merge-queue/lifecycle' },
      { title: 'Priority', path: '/merge-queue/priority' },
      { title: 'Freeze', path: '/merge-queue/freeze' },
      { title: 'Multiple Queues', path: '/merge-queue/multi' },
      { title: 'Speculative Checks', path: '/merge-queue/speculative-checks' },
      { title: 'Batches', path: '/merge-queue/batches' },
      { title: 'Partitions', path: '/merge-queue/partitions' },
    ],
  },
  {
    title: 'Commands',
    children: [
      { title: 'About Commands', path: '/merge-queue/intro' },
      { title: 'Backport', path: '/merge-queue/intro' },
      { title: 'Copy', path: '/merge-queue/intro' },
      { title: 'Queue', path: '/merge-queue/intro' },
      { title: 'Rebase', path: '/merge-queue/intro' },
      { title: 'Refresh', path: '/merge-queue/intro' },
      { title: 'Requeue', path: '/merge-queue/intro' },
      { title: 'Squash', path: '/merge-queue/intro' },
      { title: 'Update', path: '/merge-queue/intro' },
      { title: 'Unqueue', path: '/merge-queue/intro' },
    ],
  },
  {
    title: 'Technical Reference',
    children: [
      { title: 'Configuration File', path: '/merge-queue/intro' },
      { title: 'Sharing Configuration', path: '/merge-queue/intro' },
      { title: 'Conditions', path: '/merge-queue/intro' },
      { title: 'Data Types', path: '/merge-queue/intro' },
    ],
  },
  {
    title: 'Integration',
    children: [
      { title: 'GitHub Actions', path: '/merge-queue/intro' },
      { title: 'Jenkins', path: '/merge-queue/intro' },
      { title: 'TeamCity', path: '/merge-queue/intro' },
      { title: 'Continuous Integration', path: '/merge-queue/intro' },
      { title: 'Datadog', path: '/merge-queue/intro' },
      {
        title: 'Stacked Pull Requests',
        children: [
          { title: 'Graphite', path: '/integration/stacked_prs/graphite' },
          { title: 'Others', path: '/integration/stacked_prs/others' },
        ],
      },
    ],
  },
  { title: 'Security', path: '/security' },
  { title: 'Badge', path: '/badge' },
  { title: 'Billing', path: '/billing' },
];

function addUuidOnGroups(items: NavItem[]): NavItem[] {
  return items.map((item) => {
    if (item.children) {
      return {
        ...item,
        id: v5(JSON.stringify(item.children), v5.DNS),
        children: addUuidOnGroups(item.children),
      };
    }

    return item;
  });
}

export default addUuidOnGroups(navItems);
