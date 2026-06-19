import { v5 } from 'uuid';

export type NavItem = {
  title: string;
  path?: string;
  children?: NavItem[];
  id?: string;
  icon?: string;
};

const navItems: NavItem[] = [
  { title: 'Home', path: '/', icon: 'lucide:house' },
  {
    title: 'Merge Queue',
    icon: 'mergify:merge-queue',
    path: '/merge-queue',
    children: [
      { title: 'Overview', path: '/merge-queue', icon: 'lucide:lightbulb' },
      { title: 'Setup', path: '/merge-queue/setup', icon: 'lucide:settings' },
      {
        title: 'Queue Modes',
        path: '/merge-queue/queue-modes',
        icon: 'lucide:git-fork',
      },
      { title: 'Queue Rules', path: '/merge-queue/rules', icon: 'lucide:layers' },
      {
        title: 'Merge Strategies',
        path: '/merge-queue/merge-strategies',
        icon: 'octicon:git-merge-16',
      },
      { title: 'Lifecycle', path: '/merge-queue/lifecycle', icon: 'lucide:refresh-cw' },
      { title: 'Priority', path: '/merge-queue/priority', icon: 'lucide:traffic-cone' },
      { title: 'Pause', path: '/merge-queue/pause', icon: 'lucide:circle-pause' },
      { title: 'Performance', path: '/merge-queue/performance', icon: 'lucide:gauge' },
      { title: 'Batches', path: '/merge-queue/batches', icon: 'lucide:boxes' },
      {
        title: 'Scopes',
        path: '/merge-queue/scopes',
        icon: 'lucide:network',
        children: [
          { title: 'Overview', path: '/merge-queue/scopes', icon: 'lucide:lightbulb' },
          {
            title: 'File Patterns',
            path: '/merge-queue/scopes/file-patterns',
            icon: 'lucide:file',
          },
          { title: 'Nx', path: '/merge-queue/scopes/nx', icon: 'simple-icons:nx' },
          { title: 'Bazel', path: '/merge-queue/scopes/bazel', icon: 'simple-icons:bazel' },
          {
            title: 'Turborepo',
            path: '/merge-queue/scopes/turborepo',
            icon: 'simple-icons:turborepo',
          },
          {
            title: 'Other Build Tools',
            path: '/merge-queue/scopes/others',
            icon: 'lucide:settings',
          },
        ],
      },
      { title: 'Stacked PRs', path: '/merge-queue/stacks', icon: 'lucide:layers' },
      { title: 'Monorepo', path: '/merge-queue/monorepo', icon: 'lucide:boxes' },
      { title: 'Two-Step CI', path: '/merge-queue/two-step', icon: 'lucide:arrow-right-left' },
      { title: 'Deployment', path: '/merge-queue/deploy', icon: 'lucide:rocket' },
      {
        title: 'GitHub Rulesets Compatibility',
        path: '/merge-queue/github-rulesets',
        icon: 'simple-icons:github',
      },
      { title: 'Monitoring', path: '/merge-queue/monitoring', icon: 'lucide:layout-dashboard' },
    ],
  },
  {
    title: 'CI Insights',
    path: '/ci-insights',
    icon: 'mergify:ci-insights',
    children: [
      { title: 'Overview', path: '/ci-insights', icon: 'lucide:lightbulb' },
      { title: 'Runners', path: '/ci-insights/runners', icon: 'lucide:server' },
      { title: 'Jobs', path: '/ci-insights/jobs', icon: 'lucide:list-checks' },
      { title: 'Auto-Retry', path: '/ci-insights/auto-retry', icon: 'lucide:rotate-cw' },
      {
        title: 'Flaky Test Detection',
        path: '/ci-insights/flaky-test-detection',
        icon: 'lucide:bug',
      },
      {
        title: 'CI Setup',
        icon: 'lucide:settings',
        children: [
          {
            title: 'GitHub Actions',
            path: '/ci-insights/setup/github-actions',
            icon: 'simple-icons:githubactions',
          },
          {
            title: 'Buildkite',
            path: '/ci-insights/setup/buildkite',
            icon: 'simple-icons:buildkite',
          },
          { title: 'Jenkins', path: '/ci-insights/setup/jenkins', icon: 'simple-icons:jenkins' },
        ],
      },
    ],
  },
  {
    title: 'Test Insights',
    path: '/test-insights',
    icon: 'mergify:test-insights',
    children: [
      { title: 'Overview', path: '/test-insights', icon: 'lucide:lightbulb' },
      { title: 'Prevention', path: '/test-insights/prevention', icon: 'lucide:shield-half' },
      { title: 'Detection', path: '/test-insights/detection', icon: 'lucide:search' },
      { title: 'Mitigation', path: '/test-insights/mitigation', icon: 'lucide:radiation' },
      { title: 'Quarantine', path: '/test-insights/quarantine', icon: 'lucide:radiation' },
      {
        title: 'Test Frameworks Setup',
        path: '/test-insights#test-framework-configuration',
        icon: 'lucide:flask-conical',
        children: [
          {
            title: 'Cypress',
            path: '/test-insights/test-frameworks/cypress',
            icon: 'simple-icons:cypress',
          },
          { title: 'Go', path: '/test-insights/test-frameworks/golang', icon: 'simple-icons:go' },
          { title: 'Jest', path: '/test-insights/test-frameworks/jest', icon: 'simple-icons:jest' },
          {
            title: 'JUnit',
            path: '/test-insights/test-frameworks/junit',
            icon: 'simple-icons:junit5',
          },
          {
            title: 'minitest',
            path: '/test-insights/test-frameworks/minitest',
            icon: 'simple-icons:ruby',
          },
          {
            title: 'MSTest',
            path: '/test-insights/test-frameworks/mstest',
            icon: 'simple-icons:dotnet',
          },
          {
            title: 'NUnit',
            path: '/test-insights/test-frameworks/nunit',
            icon: 'simple-icons:dotnet',
          },
          { title: 'Pest', path: '/test-insights/test-frameworks/pest', icon: 'simple-icons:php' },
          {
            title: 'PHPUnit',
            path: '/test-insights/test-frameworks/phpunit',
            icon: 'simple-icons:php',
          },
          {
            title: 'Playwright',
            path: '/test-insights/test-frameworks/playwright',
            icon: 'simple-icons:playwright',
          },
          {
            title: 'pytest',
            path: '/test-insights/test-frameworks/pytest',
            icon: 'simple-icons:pytest',
          },
          {
            title: 'RSpec',
            path: '/test-insights/test-frameworks/rspec',
            icon: 'simple-icons:ruby',
          },
          { title: 'Rust', path: '/test-insights/test-frameworks/rust', icon: 'simple-icons:rust' },
          {
            title: 'TestNG',
            path: '/test-insights/test-frameworks/testng',
            icon: 'simple-icons:testinglibrary',
          },
          {
            title: 'Vitest',
            path: '/test-insights/test-frameworks/vitest',
            icon: 'simple-icons:vitest',
          },
        ],
      },
    ],
  },
  {
    title: 'Merge Protections',
    path: '/merge-protections',
    icon: 'mergify:merge-protections',
    children: [
      { title: 'Overview', path: '/merge-protections', icon: 'lucide:lightbulb' },
      { title: 'Setup', path: '/merge-protections/setup', icon: 'lucide:settings' },
      { title: 'Auto-Merge', path: '/merge-protections/auto-merge', icon: 'lucide:zap' },
      {
        title: 'Built‑in Protections',
        path: '/merge-protections/builtin',
        icon: 'lucide:shield-user',
      },
      { title: 'Custom Rules', path: '/merge-protections/custom-rules', icon: 'lucide:ruler' },
      { title: 'Freezes', path: '/merge-protections/freeze', icon: 'lucide:snowflake' },
      { title: 'Examples', path: '/merge-protections/examples', icon: 'lucide:lightbulb' },
    ],
  },
  {
    title: 'Stacks',
    path: '/stacks',
    icon: 'mergify:stacks',
    children: [
      { title: 'Overview', path: '/stacks', icon: 'lucide:lightbulb' },
      { title: 'Concepts', path: '/stacks/concepts', icon: 'lucide:network' },
      { title: 'Setup', path: '/stacks/setup', icon: 'lucide:wrench' },
      { title: 'Creating Stacks', path: '/stacks/creating', icon: 'lucide:layers' },
      { title: 'Updating Stacks', path: '/stacks/updating', icon: 'lucide:square-pen' },
      { title: 'Reviewing Stacks', path: '/stacks/reviewing', icon: 'lucide:search' },
      { title: 'Team Adoption', path: '/stacks/team', icon: 'lucide:users' },
      {
        title: 'Compare Tools',
        path: '/stacks/compare',
        icon: 'lucide:scale',
        children: [
          { title: 'Overview', path: '/stacks/compare', icon: 'lucide:lightbulb' },
          { title: 'vs Plain Git', path: '/stacks/compare/plain-git', icon: 'simple-icons:git' },
          { title: 'vs gh-stack', path: '/stacks/compare/gh-stack', icon: 'simple-icons:github' },
          {
            title: 'vs Graphite',
            path: '/stacks/compare/graphite',
            icon: 'simple-icons:graphite',
          },
        ],
      },
    ],
  },
  {
    title: 'Workflow Automation',
    icon: 'lucide:zap',
    path: '/workflow',
    children: [
      { title: 'Workflow Automation', path: '/workflow/', icon: 'lucide:zap' },
      { title: 'Rule Syntax', path: '/workflow/rule-syntax', icon: 'lucide:badge-question-mark' },
      {
        title: 'Actions',
        icon: 'lucide:rocket',
        path: '/workflow/actions',
        children: [
          { title: 'Assign', path: '/workflow/actions/assign', icon: 'lucide:user-plus' },
          { title: 'Backport', path: '/workflow/actions/backport', icon: 'lucide:git-branch' },
          { title: 'Close', path: '/workflow/actions/close', icon: 'lucide:circle-x' },
          { title: 'Copy', path: '/workflow/actions/copy', icon: 'lucide:share-2' },
          { title: 'Comment', path: '/workflow/actions/comment', icon: 'lucide:list' },
          {
            title: 'Delete Head Branch (Deprecated)',
            path: '/workflow/actions/delete_head_branch',
            icon: 'lucide:scissors',
          },
          {
            title: 'Dismiss Reviews',
            path: '/workflow/actions/dismiss_reviews',
            icon: 'lucide:message-square-x',
          },
          { title: 'Edit', path: '/workflow/actions/edit', icon: 'lucide:type' },
          {
            title: 'GitHub Actions',
            path: '/workflow/actions/github_actions',
            icon: 'simple-icons:githubactions',
          },
          { title: 'Label', path: '/workflow/actions/label', icon: 'lucide:badge-check' },
          { title: 'Merge', path: '/workflow/actions/merge', icon: 'octicon:git-merge-16' },
          {
            title: 'Post Check (Deprecated)',
            path: '/workflow/actions/post_check',
            icon: 'lucide:circle-check',
          },
          { title: 'Queue', path: '/workflow/actions/queue', icon: 'mergify:merge-queue' },
          { title: 'Rebase', path: '/workflow/actions/rebase', icon: 'lucide:git-branch' },
          {
            title: 'Request Reviews',
            path: '/workflow/actions/request_reviews',
            icon: 'octicon:code-review-16',
          },
          { title: 'Review', path: '/workflow/actions/review', icon: 'lucide:message-square-text' },
          { title: 'Update', path: '/workflow/actions/update', icon: 'lucide:git-branch' },
          { title: 'Squash', path: '/workflow/actions/squash', icon: 'lucide:layers' },
        ],
      },
    ],
  },
  {
    title: 'Monorepo CI',
    path: '/monorepo-ci',
    icon: 'lucide:network',
    children: [
      { title: 'Overview', path: '/monorepo-ci', icon: 'lucide:network' },
      {
        title: 'GitHub Actions',
        path: '/monorepo-ci/github-actions',
        icon: 'simple-icons:githubactions',
      },
      {
        title: 'Buildkite',
        path: '/monorepo-ci/buildkite',
        icon: 'simple-icons:buildkite',
      },
    ],
  },
  {
    title: 'Rule Engine',
    icon: 'lucide:book',
    children: [
      { title: 'Configuration File', path: '/configuration/file-format', icon: 'lucide:file' },
      {
        title: 'Conditions',
        path: '/configuration/conditions',
        icon: 'lucide:badge-question-mark',
      },
      { title: 'Data Types', path: '/configuration/data-types', icon: 'lucide:type' },
      {
        title: 'Sharing Configuration',
        path: '/configuration/sharing',
        icon: 'lucide:share-2',
      },
    ],
  },
  {
    title: 'Commands',
    icon: 'lucide:command',
    children: [
      { title: 'About Commands', path: '/commands' },
      { title: 'Restrictions', path: '/commands/restrictions' },
      { title: 'Backport', path: '/commands/backport' },
      { title: 'Copy', path: '/commands/copy' },
      { title: 'Queue', path: '/commands/queue' },
      { title: 'Rebase', path: '/commands/rebase' },
      { title: 'Refresh', path: '/commands/refresh' },
      { title: 'Squash', path: '/commands/squash' },
      { title: 'Update', path: '/commands/update' },
      { title: 'Dequeue', path: '/commands/dequeue' },
    ],
  },
  {
    title: 'API',
    icon: 'lucide:braces',
    children: [
      { title: 'Usage', path: '/api/usage', icon: 'lucide:braces' },
      {
        title: 'Reference',
        path: '/api/',
        icon: 'lucide:list',
        children: [
          { title: 'Applications', path: '/api/applications' },
          { title: 'Queues', path: '/api/queues' },
          { title: 'Merge Queue', path: '/api/merge-queue' },
          { title: 'Statistics', path: '/api/statistics' },
          { title: 'Simulator', path: '/api/simulator' },
          { title: 'Event Logs', path: '/api/eventlogs' },
          { title: 'Badges', path: '/api/badges' },
          { title: 'Scheduled Freeze', path: '/api/scheduled-freeze' },
          { title: 'Test Insights', path: '/api/test-insights' },
        ],
      },
    ],
  },
  {
    title: 'CLI',
    icon: 'lucide:terminal',
    children: [
      { title: 'Usage', path: '/cli/usage', icon: 'lucide:terminal' },
      {
        title: 'Reference',
        path: '/cli/',
        icon: 'lucide:list',
        children: [
          { title: 'Merge Queue', path: '/cli/queue' },
          { title: 'Stacked Pull Requests', path: '/cli/stack' },
          { title: 'CI Insights', path: '/cli/ci' },
          { title: 'Test Health', path: '/cli/tests' },
          { title: 'Scheduled Freezes', path: '/cli/freeze' },
          { title: 'Configuration', path: '/cli/config' },
          { title: 'Maintenance', path: '/cli/self-update' },
        ],
      },
    ],
  },
  {
    title: 'Integrations',
    icon: 'lucide:blocks',
    path: '/integrations',
    children: [
      { title: 'GitHub', path: '/integrations/github', icon: 'simple-icons:github' },
      { title: 'GitHub Actions', path: '/integrations/gha', icon: 'simple-icons:githubactions' },
      { title: 'Buildkite', path: '/integrations/buildkite', icon: 'simple-icons:buildkite' },
      { title: 'Jenkins', path: '/integrations/jenkins', icon: 'simple-icons:jenkins' },
      {
        title: 'Other CI (status checks)',
        path: '/integrations/ci-status-checks',
        icon: 'lucide:circle-check',
      },
      { title: 'Datadog', path: '/integrations/datadog', icon: 'simple-icons:datadog' },
      { title: 'Slack', path: '/integrations/slack', icon: 'simple-icons:slack' },
      { title: 'Dependabot', path: '/integrations/dependabot', icon: 'simple-icons:dependabot' },
      { title: 'Terraform', path: '/integrations/terraform', icon: 'simple-icons:terraform' },
    ],
  },
  {
    title: 'Migrate to Mergify',
    path: '/migrate',
    icon: 'lucide:arrow-right-left',
    children: [
      { title: 'Overview', path: '/migrate', icon: 'lucide:lightbulb' },
      { title: 'From Bulldozer', path: '/migrate/bulldozer', icon: 'lucide:truck' },
      { title: 'From Bors‑NG', path: '/migrate/bors-ng', icon: 'lucide:bot' },
      {
        title: 'From GitHub Merge Queue',
        path: '/migrate/github-merge-queue',
        icon: 'simple-icons:github',
      },
    ],
  },
  { title: 'Browser Extensions', path: '/browser-extensions', icon: 'lucide:puzzle' },
  { title: 'Security', path: '/security', icon: 'lucide:shield' },
  { title: 'Support', path: '/support', icon: 'lucide:life-buoy' },
  { title: 'Billing', path: '/billing', icon: 'lucide:banknote' },
  { title: 'Changelog', path: '/changelog', icon: 'lucide:list' },
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
