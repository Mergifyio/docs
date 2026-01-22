import { v5 } from 'uuid';
import MergeQueueIcon from '../components/MergeQueueIcon.astro';

export type NavItem = {
  title: string;
  path?: string;
  children?: NavItem[];
  id?: string;
  icon?: string | typeof MergeQueueIcon;
};

const navItems: NavItem[] = [
  { title: 'Home', path: '/', icon: 'fa6-solid:house' },
  {
    title: 'CI Insights',
    path: '/ci-insights',
    icon: 'mdi:lightbulb-outline',
    children: [
      { title: 'Overview', path: '/ci-insights', icon: 'mdi:lightbulb-outline' },
      {
        title: 'Flaky Test Detection',
        path: '/ci-insights/flaky-test-detection',
        icon: 'fa6-solid:bug',
      },
      { title: 'Auto-Retry', path: '/ci-insights/auto-retry', icon: 'fa6-solid:rotate-right' },
      { title: 'Quarantine', path: '/ci-insights/quarantine', icon: 'fa-solid:radiation' },
      {
        title: 'CI Setup',
        icon: 'fa6-solid:gear',
        children: [
          {
            title: 'GitHub Actions',
            path: '/ci-insights/setup/github-actions',
            icon: 'simple-icons:githubactions',
          },
          { title: 'Jenkins', path: '/ci-insights/setup/jenkins', icon: 'simple-icons:jenkins' },
        ],
      },
      {
        title: 'Test Frameworks Setup',
        path: '/ci-insights#test-framework-configuration',
        icon: 'grommet-icons:test',
        children: [
          {
            title: 'Cypress',
            path: '/ci-insights/test-frameworks/cypress',
            icon: 'simple-icons:cypress',
          },
          { title: 'Go', path: '/ci-insights/test-frameworks/golang', icon: 'simple-icons:go' },
          { title: 'Jest', path: '/ci-insights/test-frameworks/jest', icon: 'simple-icons:jest' },
          {
            title: 'JUnit',
            path: '/ci-insights/test-frameworks/junit',
            icon: 'simple-icons:junit5',
          },
          {
            title: 'minitest',
            path: '/ci-insights/test-frameworks/minitest',
            icon: 'simple-icons:ruby',
          },
          {
            title: 'MSTest',
            path: '/ci-insights/test-frameworks/mstest',
            icon: 'simple-icons:dotnet',
          },
          {
            title: 'NUnit',
            path: '/ci-insights/test-frameworks/nunit',
            icon: 'simple-icons:dotnet',
          },
          { title: 'Pest', path: '/ci-insights/test-frameworks/pest', icon: 'simple-icons:php' },
          {
            title: 'PHPUnit',
            path: '/ci-insights/test-frameworks/phpunit',
            icon: 'simple-icons:php',
          },
          {
            title: 'Playwright',
            path: '/ci-insights/test-frameworks/playwright',
            icon: 'simple-icons:playwright',
          },
          {
            title: 'pytest',
            path: '/ci-insights/test-frameworks/pytest',
            icon: 'simple-icons:pytest',
          },
          { title: 'RSpec', path: '/ci-insights/test-frameworks/rspec', icon: 'simple-icons:ruby' },
          { title: 'Rust', path: '/ci-insights/test-frameworks/rust', icon: 'simple-icons:rust' },
          {
            title: 'TestNG',
            path: '/ci-insights/test-frameworks/testng',
            icon: 'simple-icons:testinglibrary',
          },
          {
            title: 'Vitest',
            path: '/ci-insights/test-frameworks/vitest',
            icon: 'simple-icons:vitest',
          },
        ],
      },
    ],
  },
  {
    title: 'Merge Queue',
    icon: MergeQueueIcon,
    path: '/merge-queue',
    children: [
      { title: 'Introduction', path: '/merge-queue', icon: 'fa6-regular:lightbulb' },
      { title: 'Setup', path: '/merge-queue/setup', icon: 'fa6-solid:gear' },
      { title: 'Queue Rules', path: '/merge-queue/rules', icon: 'bi:stack' },
      { title: 'Lifecycle', path: '/merge-queue/lifecycle', icon: 'tabler:refresh' },
      { title: 'Priority', path: '/merge-queue/priority', icon: 'fa6-solid:traffic-light' },
      { title: 'Pause', path: '/merge-queue/pause', icon: 'fa6-regular:circle-pause' },
      { title: 'Performance', path: '/merge-queue/performance', icon: 'tabler:gauge' },
      {
        title: 'Parallel Checks',
        path: '/merge-queue/parallel-checks',
        icon: 'tabler:arrows-split-2',
      },
      { title: 'Batches', path: '/merge-queue/batches', icon: 'tabler:packages' },
      {
        title: 'Scopes',
        path: '/merge-queue/scopes',
        icon: 'fa6-solid:diagram-project',
        children: [
          { title: 'Overview', path: '/merge-queue/scopes', icon: 'fa6-regular:lightbulb' },
          {
            title: 'File Patterns',
            path: '/merge-queue/scopes/file-patterns',
            icon: 'mdi:file-outline',
          },
          { title: 'Nx', path: '/merge-queue/scopes/nx', icon: 'simple-icons:nx' },
          { title: 'Bazel', path: '/merge-queue/scopes/bazel', icon: 'simple-icons:bazel' },
          {
            title: 'Turborepo',
            path: '/merge-queue/scopes/turborepo',
            icon: 'simple-icons:turborepo',
          },
          { title: 'Other Build Tools', path: '/merge-queue/scopes/others', icon: 'bi:gear' },
        ],
      },
      { title: 'Monorepo', path: '/merge-queue/monorepo', icon: 'bi:boxes' },
      { title: 'Two-Step CI', path: '/merge-queue/two-step', icon: 'fa6-solid:stairs' },
      { title: 'Deployment', path: '/merge-queue/deploy', icon: 'mdi:rocket-launch-outline' },
      {
        title: 'Browser Extensions',
        path: '/merge-queue/browser-extensions',
        icon: 'fa6-solid:puzzle-piece',
      },
      { title: 'Monitoring', path: '/merge-queue/monitoring', icon: 'mdi:monitor-dashboard' },
    ],
  },
  {
    title: 'Monorepo CI',
    path: '/monorepo-ci',
    icon: 'tabler:topology-star-ring-3',
    children: [
      { title: 'Overview', path: '/monorepo-ci', icon: 'tabler:topology-star-ring-3' },
      {
        title: 'GitHub Actions',
        path: '/monorepo-ci/github-actions',
        icon: 'simple-icons:githubactions',
      },
    ],
  },
  {
    title: 'Merge Protections',
    path: '/merge-protections',
    icon: 'fa6-solid:user-shield',
    children: [
      { title: 'Overview', path: '/merge-protections', icon: 'fa6-regular:lightbulb' },
      { title: 'Setup', path: '/merge-protections/setup', icon: 'fa6-solid:gear' },
      {
        title: 'Built‑in Protections',
        path: '/merge-protections/builtin',
        icon: 'fa6-solid:user-shield',
      },
      { title: 'Custom Rules', path: '/merge-protections/custom-rules', icon: 'bi:rulers' },
      { title: 'Freezes', path: '/merge-protections/freeze', icon: 'fa6-solid:snowflake' },
      { title: 'Examples', path: '/merge-protections/examples', icon: 'bi:lightbulb' },
    ],
  },
  {
    title: 'Workflow Automation',
    icon: 'bi:gear',
    path: '/workflow',
    children: [
      { title: 'Introducing Workflow Automation', path: '/workflow/', icon: 'bi:robot' },
      {
        title: 'Writing Your First Rule',
        path: '/workflow/writing-your-first-rule',
        icon: 'bi:rulers',
      },
      { title: 'Rule Syntax', path: '/workflow/rule-syntax', icon: 'bi:patch-question' },
      {
        title: 'Use Cases',
        icon: 'bi:lightbulb',
        children: [
          { title: 'Automatic Merge', path: '/workflow/automerge', icon: 'octicon:git-merge-16' },
          {
            title: 'Request Reviews',
            path: '/workflow/request-reviews',
            icon: 'octicon:code-review-16',
          },
          {
            title: 'Delete Head Branches',
            path: '/workflow/delete-head-branches',
            icon: 'bi:scissors',
          },
          {
            title: 'Dismiss Reviews',
            path: '/workflow/dismiss-reviews',
            icon: 'tabler:message-x',
          },
          { title: 'Rebasing PRs', path: '/workflow/rebase', icon: 'tabler:git-branch' },
        ],
      },
      {
        title: 'Actions',
        icon: 'bi:rocket',
        path: '/workflow/actions',
        children: [
          { title: 'Assign', path: '/workflow/actions/assign', icon: 'fa6-solid:user-plus' },
          { title: 'Backport', path: '/workflow/actions/backport', icon: 'tabler:git-branch' },
          { title: 'Close', path: '/workflow/actions/close', icon: 'fa6-solid:circle-xmark' },
          { title: 'Copy', path: '/workflow/actions/copy', icon: 'fa6-solid:share-nodes' },
          { title: 'Comment', path: '/workflow/actions/comment', icon: 'fa-solid:list-alt' },
          {
            title: 'Delete Head Branch',
            path: '/workflow/actions/delete_head_branch',
            icon: 'bi:scissors',
          },
          {
            title: 'Dismiss Reviews',
            path: '/workflow/actions/dismiss_reviews',
            icon: 'tabler:message-x',
          },
          { title: 'Edit', path: '/workflow/actions/edit', icon: 'feather:type' },
          {
            title: 'GitHub Actions',
            path: '/workflow/actions/github_actions',
            icon: 'simple-icons:githubactions',
          },
          { title: 'Label', path: '/workflow/actions/label', icon: 'bi:patch-check-fill' },
          { title: 'Merge', path: '/workflow/actions/merge', icon: 'octicon:git-merge-16' },
          {
            title: 'Post Check',
            path: '/workflow/actions/post_check',
            icon: 'fa6-regular:circle-check',
          },
          { title: 'Queue', path: '/workflow/actions/queue', icon: MergeQueueIcon },
          { title: 'Rebase', path: '/workflow/actions/rebase', icon: 'tabler:git-branch' },
          {
            title: 'Request Reviews',
            path: '/workflow/actions/request_reviews',
            icon: 'octicon:code-review-16',
          },
          { title: 'Review', path: '/workflow/actions/review', icon: 'mdi:rate-review' },
          { title: 'Update', path: '/workflow/actions/update', icon: 'tabler:git-branch' },
          { title: 'Squash', path: '/workflow/actions/squash', icon: 'bi:stack' },
        ],
      },
    ],
  },
  {
    title: 'Rule Engine',
    icon: 'bi:book',
    children: [
      { title: 'Configuration File', path: '/configuration/file-format', icon: 'mdi:file-outline' },
      { title: 'Conditions', path: '/configuration/conditions', icon: 'bi:patch-question' },
      { title: 'Data Types', path: '/configuration/data-types', icon: 'feather:type' },
      {
        title: 'Sharing Configuration',
        path: '/configuration/sharing',
        icon: 'fa6-solid:share-nodes',
      },
    ],
  },
  {
    title: 'Commands',
    icon: 'bi:command',
    children: [
      { title: 'About Commands', path: '/commands' },
      { title: 'Restrictions', path: '/commands/restrictions' },
      { title: 'Backport', path: '/commands/backport' },
      { title: 'Copy', path: '/commands/copy' },
      { title: 'Queue', path: '/commands/queue' },
      { title: 'Rebase', path: '/commands/rebase' },
      { title: 'Refresh', path: '/commands/refresh' },
      { title: 'Requeue', path: '/commands/requeue' },
      { title: 'Squash', path: '/commands/squash' },
      { title: 'Update', path: '/commands/update' },
      { title: 'Dequeue', path: '/commands/dequeue' },
    ],
  },
  {
    title: 'API',
    icon: 'mdi:api',
    children: [
      { title: 'Usage', path: '/api-usage', icon: 'mdi:api' },
      { title: 'Reference', path: '/api/', icon: 'fa-solid:list-alt' },
    ],
  },
  {
    title: 'Integrations',
    icon: 'bi:plugin',
    path: '/integrations',
    children: [
      { title: 'GitHub', path: '/integrations/github', icon: 'simple-icons:github' },
      { title: 'GitHub Actions', path: '/integrations/gha', icon: 'simple-icons:githubactions' },
      { title: 'CircleCI', path: '/integrations/circleci', icon: 'simple-icons:circleci' },
      { title: 'Jenkins', path: '/integrations/jenkins', icon: 'simple-icons:jenkins' },
      { title: 'TeamCity', path: '/integrations/teamcity', icon: 'simple-icons:teamcity' },
      { title: 'BuildKite', path: '/integrations/buildkite', icon: 'simple-icons:buildkite' },
      { title: 'GitLab', path: '/integrations/gitlab', icon: 'simple-icons:gitlab' },
      { title: 'Datadog', path: '/integrations/datadog', icon: 'simple-icons:datadog' },
      { title: 'Slack', path: '/integrations/slack', icon: 'simple-icons:slack' },
      { title: 'Graphite', path: '/integrations/graphite', icon: 'simple-icons:graphite' },
      { title: 'Dependabot', path: '/integrations/dependabot', icon: 'simple-icons:dependabot' },
      { title: 'Renovate', path: '/integrations/renovate', icon: 'simple-icons:renovate' },
      { title: 'Snyk', path: '/integrations/snyk', icon: 'simple-icons:snyk' },
    ],
  },
  {
    title: 'Migrate to Mergify',
    path: '/migrate',
    icon: 'fa6-solid:stairs',
    children: [
      { title: 'Overview', path: '/migrate', icon: 'fa6-regular:lightbulb' },
      { title: 'From Bulldozer', path: '/migrate/bulldozer', icon: 'tabler:bulldozer' },
      { title: 'From Bors‑NG', path: '/migrate/bors-ng', icon: 'bi:robot' },
      {
        title: 'From GitHub Merge Queue',
        path: '/migrate/github-merge-queue',
        icon: 'simple-icons:github',
      },
    ],
  },
  { title: 'Stacks', path: '/stacks', icon: 'bi:stack' },
  { title: 'Security', path: '/security', icon: 'fa-solid:shield-alt' },
  { title: 'Support', path: '/support', icon: 'fa-solid:life-ring' },
  { title: 'Badge', path: '/badge', icon: 'bi:patch-check-fill' },
  { title: 'Billing', path: '/billing', icon: 'fa6-solid:money-bill-1' },
  { title: 'Changelog', path: '/changelog', icon: 'fa-solid:list-alt' },
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
