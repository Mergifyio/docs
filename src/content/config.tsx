import React from 'react';
import { BiBadgeCheck } from 'react-icons/bi';
import {
  BsBook, BsCommand, BsGear, BsLightbulb, BsPlugin, BsRocket, BsStack,
} from 'react-icons/bs';
import { FaJenkins, FaShieldAlt } from 'react-icons/fa';
import { FaMoneyBill1 } from 'react-icons/fa6';
import {
  SiDatadog, SiSnyk, SiDependabot, SiTeamcity,
} from 'react-icons/si';
import { VscGithubAction } from 'react-icons/vsc';

import { v5 } from 'uuid';

import MergeQueueIcon from '../components/MergeQueueIcon';

export type NavItem = {
  title: string,
  path?: string,
  children?: NavItem[],
  id?: string,
  icon?: React.ReactElement
};

const navItems: NavItem[] = [
  { title: 'Home', path: '/' },
  { title: 'Getting Started', path: '/getting-started' },
  {
    title: 'Workflow Automation',
    icon: <BsGear />,
    path: '/workflow',
    children: [
      { title: 'Writing Your First Rule', path: '/workflow/writing-your-first-rule' },
      {
        title: 'Use Cases',
        icon: <BsLightbulb />,
        children: [
          { title: 'Automatic Merge', path: '/workflow/automerge' },
        ],
      },
      {
        title: 'Actions',
        icon: <BsRocket />,
        path: '/workflow/actions',
        children: [
          { title: 'Assign', path: '/workflow/actions/assign' },
          { title: 'Backport', path: '/workflow/actions/backport' },
          { title: 'Close', path: '/workflow/actions/close' },
          { title: 'Copy', path: '/workflow/actions/copy' },
          { title: 'Comment', path: '/workflow/actions/comment' },
          { title: 'Delete Head Branch', path: '/workflow/actions/delete_head_branch' },
          { title: 'Dismiss Reviews', path: '/workflow/actions/dismiss_reviews' },
          { title: 'Edit', path: '/workflow/actions/edit' },
          { title: 'GitHub Actions', path: '/workflow/actions/github_actions' },
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
    icon: <MergeQueueIcon />,
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
    icon: <BsCommand />,
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
      { title: 'Unqueue', path: '/commands/unqueue' },
    ],
  },
  {
    title: 'Technical Reference',
    icon: <BsBook />,
    children: [
      { title: 'Configuration File', path: '/configuration/file-format' },
      { title: 'Sharing Configuration', path: '/configuration/sharing' },
      { title: 'Conditions', path: '/configuration/conditions' },
      { title: 'Data Types', path: '/configuration/data-types' },
      { title: 'API Usage', path: '/api-usage' },
      { title: 'API Reference', path: '/api/' },
    ],
  },
  {
    title: 'Integrations',
    icon: <BsPlugin />,
    path: '/integrations',
    children: [
      { title: 'GitHub Actions', path: '/integrations/gha', icon: <VscGithubAction /> },
      { title: 'Jenkins', path: '/integrations/jenkins', icon: <FaJenkins /> },
      { title: 'TeamCity', path: '/integrations/teamcity', icon: <SiTeamcity /> },
      { title: 'Datadog', path: '/integrations/datadog', icon: <SiDatadog /> },
      { title: 'Graphite', path: '/integrations/graphite', icon: <BsStack /> },
      { title: 'Dependabot', path: '/integrations/dependabot', icon: <SiDependabot /> },
      { title: 'Snyk', path: '/integrations/snyk', icon: <SiSnyk /> },
    ],
  },
  {
    title: 'Stacked PRs',
    icon: <BsStack />,
    path: '/stacked_prs',
  },
  { title: 'Security', path: '/security', icon: <FaShieldAlt /> },
  { title: 'Badge', path: '/badge', icon: <BiBadgeCheck /> },
  { title: 'Billing', path: '/billing', icon: <FaMoneyBill1 /> },
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
