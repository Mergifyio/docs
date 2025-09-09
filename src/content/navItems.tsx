/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { IconType } from 'react-icons';
import { AiOutlineApi, AiOutlineDeploymentUnit, AiOutlineFile } from 'react-icons/ai';
import { BiBadgeCheck, BiCut, BiRuler, BiSolidCoinStack } from 'react-icons/bi';
import {
  BsBook,
  BsCommand,
  BsGear,
  BsLightbulb,
  BsPatchQuestion,
  BsPlugin,
  BsRobot,
  BsRocket,
  BsStack,
} from 'react-icons/bs';
import { FaHome, FaRadiation, FaRegListAlt, FaShieldAlt } from 'react-icons/fa';
import {
  FaBug,
  FaCircleXmark,
  FaGear,
  FaMoneyBill1,
  FaRegCircleCheck,
  FaRegCirclePause,
  FaRegLightbulb,
  FaRotateRight,
  FaSnowflake,
  FaStairs,
  FaTrafficLight,
  FaUserPlus,
  FaUserShield,
} from 'react-icons/fa6';
import { FiType } from 'react-icons/fi';
import { GoCodeReview, GoGitMerge } from 'react-icons/go';
import { GrTest } from 'react-icons/gr';
import { LiaShareAltSolid } from 'react-icons/lia';
import { MdMonitorHeart, MdOutlineLightbulb, MdOutlineRateReview } from 'react-icons/md';
import {
  SiBuildkite,
  SiCircleci,
  SiCypress,
  SiDatadog,
  SiDependabot,
  SiDotnet,
  SiGithub,
  SiGithubactions,
  SiGitlab,
  SiGo,
  SiJavascript,
  SiJenkins,
  SiJest,
  SiJunit5,
  SiPhp,
  SiPytest,
  SiRenovate,
  SiRuby,
  SiRust,
  SiSlack,
  SiSnyk,
  SiTeamcity,
  SiTestinglibrary,
  SiVitest,
} from 'react-icons/si';
import { SlRefresh, SlSpeedometer } from 'react-icons/sl';
import { TbBulldozer, TbGitBranch, TbMessageX, TbPackages } from 'react-icons/tb';
import { TiFlowParallel } from 'react-icons/ti';

import { v5 } from 'uuid';
import MergeQueueIcon from '../components/MergeQueueIcon.astro';

export type NavItem = {
  title: string;
  path?: string;
  children?: NavItem[];
  id?: string;
  icon?: IconType;
};

const navItems: NavItem[] = [
  { title: 'Home', path: '/', icon: FaHome },
  {
    title: 'CI Insights',
    path: '/ci-insights',
    icon: MdOutlineLightbulb,
    children: [
      { title: 'Overview', path: '/ci-insights', icon: MdOutlineLightbulb },
      { title: 'Flaky Test Detection', path: '/ci-insights/flaky-test-detection', icon: FaBug },
      { title: 'Auto-Retry', path: '/ci-insights/auto-retry', icon: FaRotateRight },
      { title: 'Quarantine', path: '/ci-insights/quarantine', icon: FaRadiation },
      {
        title: 'CI Setup',
        icon: FaGear,
        children: [
          {
            title: 'GitHub Actions',
            path: '/ci-insights/setup/github-actions',
            icon: SiGithubactions,
          },
          { title: 'Jenkins', path: '/ci-insights/setup/jenkins', icon: SiJenkins },
        ],
      },
      {
        title: 'Test Frameworks Setup',
        path: '/ci-insights#test-framework-configuration',
        icon: GrTest,
        children: [
          { title: 'Cypress', path: '/ci-insights/test-frameworks/cypress', icon: SiCypress },
          { title: 'Go', path: '/ci-insights/test-frameworks/golang', icon: SiGo },
          { title: 'Jest', path: '/ci-insights/test-frameworks/jest', icon: SiJest },
          { title: 'JUnit', path: '/ci-insights/test-frameworks/junit', icon: SiJunit5 },
          { title: 'minitest', path: '/ci-insights/test-frameworks/minitest', icon: SiRuby },
          { title: 'MSTest', path: '/ci-insights/test-frameworks/mstest', icon: SiDotnet },
          { title: 'NUnit', path: '/ci-insights/test-frameworks/nunit', icon: SiDotnet },
          { title: 'Pest', path: '/ci-insights/test-frameworks/pest', icon: SiPhp },
          { title: 'PHPUnit', path: '/ci-insights/test-frameworks/phpunit', icon: SiPhp },
          {
            title: 'Playwright',
            path: '/ci-insights/test-frameworks/playwright',
            icon: SiJavascript,
          },
          { title: 'pytest', path: '/ci-insights/test-frameworks/pytest', icon: SiPytest },
          { title: 'RSpec', path: '/ci-insights/test-frameworks/rspec', icon: SiRuby },
          { title: 'Rust', path: '/ci-insights/test-frameworks/rust', icon: SiRust },
          { title: 'TestNG', path: '/ci-insights/test-frameworks/testng', icon: SiTestinglibrary },
          { title: 'Vitest', path: '/ci-insights/test-frameworks/vitest', icon: SiVitest },
        ],
      },
    ],
  },
  {
    title: 'Merge Queue',
    icon: MergeQueueIcon,
    path: '/merge-queue',
    children: [
      { title: 'Introduction', path: '/merge-queue', icon: FaRegLightbulb },
      { title: 'Setup', path: '/merge-queue/setup', icon: FaGear },
      { title: 'Queue Rules', path: '/merge-queue/rules', icon: BiSolidCoinStack },
      { title: 'Lifecycle', path: '/merge-queue/lifecycle', icon: SlRefresh },
      { title: 'Priority', path: '/merge-queue/priority', icon: FaTrafficLight },
      { title: 'Pause', path: '/merge-queue/pause', icon: FaRegCirclePause },
      { title: 'Performance', path: '/merge-queue/performance', icon: SlSpeedometer },
      { title: 'Parallel Checks', path: '/merge-queue/parallel-checks', icon: TiFlowParallel },
      { title: 'Batches', path: '/merge-queue/batches', icon: TbPackages },
      { title: 'Two-Step CI', path: '/merge-queue/two-step', icon: FaStairs },
      { title: 'Deployment', path: '/merge-queue/deploy', icon: AiOutlineDeploymentUnit },
      { title: 'Monitoring', path: '/merge-queue/monitoring', icon: MdMonitorHeart },
      { title: 'Troubleshooting', path: '/merge-queue/troubleshooting', icon: FaBug },
    ],
  },
  {
    title: 'Merge Protections',
    path: '/merge-protections',
    icon: FaUserShield,
    children: [
      { title: 'Overview', path: '/merge-protections', icon: FaRegLightbulb },
      { title: 'Setup', path: '/merge-protections/setup', icon: FaGear },
      { title: 'Built‑in Protections', path: '/merge-protections/builtin', icon: FaUserShield },
      { title: 'Custom Rules', path: '/merge-protections/custom-rules', icon: BiRuler },
      { title: 'Freezes', path: '/merge-protections/freeze', icon: FaSnowflake },
      { title: 'Examples', path: '/merge-protections/examples', icon: BsLightbulb },
    ],
  },
  {
    title: 'Workflow Automation',
    icon: BsGear,
    path: '/workflow',
    children: [
      { title: 'Introducing Workflow Automation', path: '/workflow/', icon: BsRobot },
      {
        title: 'Writing Your First Rule',
        path: '/workflow/writing-your-first-rule',
        icon: BiRuler,
      },
      { title: 'Rule Syntax', path: '/workflow/rule-syntax', icon: BsPatchQuestion },
      {
        title: 'Use Cases',
        icon: BsLightbulb,
        children: [
          { title: 'Automatic Merge', path: '/workflow/automerge', icon: GoGitMerge },
          { title: 'Request Reviews', path: '/workflow/request-reviews', icon: GoCodeReview },
          { title: 'Delete Head Branches', path: '/workflow/delete-head-branches', icon: BiCut },
          {
            title: 'Dismiss Reviews',
            path: '/workflow/dismiss-reviews',
            icon: TbMessageX,
          },
          { title: 'Rebasing PRs', path: '/workflow/rebase', icon: TbGitBranch },
        ],
      },
      {
        title: 'Actions',
        icon: BsRocket,
        path: '/workflow/actions',
        children: [
          { title: 'Assign', path: '/workflow/actions/assign', icon: FaUserPlus },
          { title: 'Backport', path: '/workflow/actions/backport', icon: TbGitBranch },
          { title: 'Close', path: '/workflow/actions/close', icon: FaCircleXmark },
          { title: 'Copy', path: '/workflow/actions/copy', icon: LiaShareAltSolid },
          { title: 'Comment', path: '/workflow/actions/comment', icon: FaRegListAlt },
          {
            title: 'Delete Head Branch',
            path: '/workflow/actions/delete_head_branch',
            icon: BiCut,
          },
          {
            title: 'Dismiss Reviews',
            path: '/workflow/actions/dismiss_reviews',
            icon: TbMessageX,
          },
          { title: 'Edit', path: '/workflow/actions/edit', icon: FiType },
          {
            title: 'GitHub Actions',
            path: '/workflow/actions/github_actions',
            icon: SiGithubactions,
          },
          { title: 'Label', path: '/workflow/actions/label', icon: BiBadgeCheck },
          { title: 'Merge', path: '/workflow/actions/merge', icon: GoGitMerge },
          { title: 'Post Check', path: '/workflow/actions/post_check', icon: FaRegCircleCheck },
          { title: 'Queue', path: '/workflow/actions/queue', icon: MergeQueueIcon },
          { title: 'Rebase', path: '/workflow/actions/rebase', icon: TbGitBranch },
          {
            title: 'Request Reviews',
            path: '/workflow/actions/request_reviews',
            icon: GoCodeReview,
          },
          { title: 'Review', path: '/workflow/actions/review', icon: MdOutlineRateReview },
          { title: 'Update', path: '/workflow/actions/update', icon: TbGitBranch },
          { title: 'Squash', path: '/workflow/actions/squash', icon: BiSolidCoinStack },
        ],
      },
    ],
  },
  {
    title: 'Rule Engine',
    icon: BsBook,
    children: [
      { title: 'Configuration File', path: '/configuration/file-format', icon: AiOutlineFile },
      { title: 'Conditions', path: '/configuration/conditions', icon: BsPatchQuestion },
      { title: 'Data Types', path: '/configuration/data-types', icon: FiType },
      { title: 'Sharing Configuration', path: '/configuration/sharing', icon: LiaShareAltSolid },
    ],
  },
  {
    title: 'Commands',
    icon: BsCommand,
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
    icon: AiOutlineApi,
    children: [
      { title: 'Usage', path: '/api-usage', icon: AiOutlineApi },
      { title: 'Reference', path: '/api/', icon: FaRegListAlt },
    ],
  },
  {
    title: 'Integrations',
    icon: BsPlugin,
    path: '/integrations',
    children: [
      { title: 'GitHub', path: '/integrations/github', icon: SiGithub },
      { title: 'GitHub Actions', path: '/integrations/gha', icon: SiGithubactions },
      { title: 'CircleCI', path: '/integrations/circleci', icon: SiCircleci },
      { title: 'Jenkins', path: '/integrations/jenkins', icon: SiJenkins },
      { title: 'TeamCity', path: '/integrations/teamcity', icon: SiTeamcity },
      { title: 'BuildKite', path: '/integrations/buildkite', icon: SiBuildkite },
      { title: 'GitLab', path: '/integrations/gitlab', icon: SiGitlab },
      { title: 'Datadog', path: '/integrations/datadog', icon: SiDatadog },
      { title: 'Slack', path: '/integrations/slack', icon: SiSlack },
      { title: 'Graphite', path: '/integrations/graphite', icon: BsStack },
      { title: 'Dependabot', path: '/integrations/dependabot', icon: SiDependabot },
      { title: 'Renovate', path: '/integrations/renovate', icon: SiRenovate },
      { title: 'Snyk', path: '/integrations/snyk', icon: SiSnyk },
    ],
  },
  {
    title: 'Migrate to Mergify',
    path: '/migrate',
    icon: FaStairs,
    children: [
      { title: 'Overview', path: '/migrate', icon: FaRegLightbulb },
      { title: 'From Bulldozer', path: '/migrate/bulldozer', icon: TbBulldozer },
    ],
  },
  { title: 'Stacks', path: '/stacks', icon: BsStack },
  { title: 'Security', path: '/security', icon: FaShieldAlt },
  { title: 'Badge', path: '/badge', icon: BiBadgeCheck },
  { title: 'Billing', path: '/billing', icon: FaMoneyBill1 },
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
