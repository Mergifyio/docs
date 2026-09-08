import type { CollectionEntry } from 'astro:content';
import { allPages } from '~/content';
import navItems from '~/content/navItems';

/**
 * What Mergify is for, in the terms an agent needs to decide whether to reach
 * for it. Deliberately concrete about the jobs and about what is out of scope:
 * "GitHub only" saves an agent from planning a GitLab integration that does not
 * exist, which is worth more than another paragraph of capabilities.
 */
const WHEN_TO_USE: string[] = [
  '## When to use Mergify',
  '',
  'Mergify is a hosted platform for teams merging code on **GitHub**. Reach for it when the task is:',
  '',
  '- **Keeping the main branch green.** Pull requests are merged through a queue that revalidates each one against the latest main, so semantic conflicts between individually-green PRs are caught before they land.',
  '- **Merging at high volume without a CI bill to match.** Speculative checks, batching and two-step CI trade queue depth against CI minutes.',
  '- **Diagnosing slow or unreliable CI.** CI Insights reports job, runner and queue-time health across GitHub Actions, CircleCI, Jenkins, Buildkite, TeamCity and GitLab CI, and can auto-retry transient job failures.',
  '- **Dealing with flaky tests.** Test Insights classifies tests as healthy, flaky or broken from rerun outcomes, catches new flakiness on the pull request, and can quarantine known-flaky tests.',
  '- **Enforcing merge requirements GitHub cannot express.** Merge Protections evaluate conditions richer than branch protection rules.',
  '- **Working on stacked pull requests.** The `mergify` CLI creates and keeps a stack of dependent PRs in sync.',
  '',
  'Mergify does **not** host code, and it does **not** support GitLab, Bitbucket or any',
  'code host other than GitHub. GitLab CI is supported as a source of CI results only.',
];

/** How an agent should read these docs and call the API. */
function howToRead(site: string): string[] {
  return [
    '## For agents',
    '',
    `- Every page listed below links to its Markdown source, and each of them serves that source from its own URL too — append \`.md\` (\`${site}/merge-queue.md\`) or send \`Accept: text/markdown\`. The generated API and CLI references are HTML only.`,
    `- The REST API is described by an OpenAPI 3.1 document at [${site}/openapi.json](${site}/openapi.json). Base URL \`https://api.mergify.com/v1\`; authenticate with \`Authorization: Bearer <token>\`, using either an application key created in the dashboard (scopes: \`admin\`, \`ci\`) or a GitHub personal access token.`,
    `- Full page list: [${site}/sitemap-index.xml](${site}/sitemap-index.xml).`,
    `- The \`mergify\` CLI drives stacked pull requests and CI test-result upload from a terminal. Install it with \`brew install mergifyio/tap/mergify-cli\` on macOS, the install script on Linux, or the release zip on Windows — see [${site}/cli/usage](${site}/cli/usage), with the command reference at [${site}/cli](${site}/cli).`,
    `- Configuration lives in \`.mergify.yml\` at the repository root; its JSON Schema is at [${site}/mergify-configuration-schema.json](${site}/mergify-configuration-schema.json).`,
  ];
}

/**
 * Auto-generated list of documentation pages for LLM consumption.
 * Uses the navigation structure (navItems) as the single source of truth for ordering & inclusion.
 */
export const GET = async () => {
  const site = import.meta.env.SITE;
  const projectName = 'Mergify';
  const summary =
    'Documentation for Mergify: automate merges, manage merge queues, enforce policies, provide CI observability and telemetry, and streamline GitHub workflows.';

  // Index docs by their exact collection id only (no fallback aliases)
  type DocEntry = CollectionEntry<'docs'>;
  const docsById: Record<string, DocEntry> = {};
  for (const p of allPages as DocEntry[]) docsById[p.id] = p;

  // Convert a nav path to a collection id (no fallback to alternative forms)
  function pathToId(path?: string): string | undefined {
    if (!path) return undefined;
    let raw = path.split('#')[0]; // drop hash anchors
    raw = raw.replace(/\/+$/, '/'); // collapse trailing slashes to one (except root)
    // Strip leading slash
    raw = raw.replace(/^\//, '');
    if (raw === '' || raw === '/') return 'index';
    if (raw.endsWith('/')) {
      // directory explicit index
      return raw.slice(0, -1) + '/index';
    }
    return raw.replace(/\/$/, '');
  }

  function buildList(items: any[], acc: string[] = [], depth = 0): string[] {
    for (const item of items) {
      const id = pathToId(item.path);
      const page = id ? docsById[id] : undefined;
      if (page) {
        const basePath = (item.path as string).split('#')[0].replace(/\/$/, '');
        const url = `${site}${basePath}` || site;
        const mdUrl = `${url}.md`;
        const title = page.data.title.replace(/\n/g, ' ').trim();
        const desc = page.data.description.replace(/\n/g, ' ').trim();
        acc.push(`${'  '.repeat(depth)}- [${title}](${mdUrl}): ${desc}`);
      }
      if (item.children) buildList(item.children, acc, page ? depth + 1 : depth);
    }
    return acc;
  }

  interface Section {
    title: string;
    lines: string[];
  }
  const sections: Section[] = [];
  for (const item of navItems) {
    if (item.title === 'Home') continue;
    const lines = buildList([item], []);
    if (lines.length) sections.push({ title: item.title, lines });
  }

  const lines: string[] = [];
  lines.push(`# ${projectName}`);
  lines.push('');
  lines.push(`> ${summary}`);
  lines.push('');
  lines.push(...WHEN_TO_USE);
  lines.push('');
  lines.push(...howToRead(site));
  lines.push('');
  for (const section of sections) {
    lines.push(`## ${section.title}`);
    lines.push('');
    lines.push(...section.lines);
    lines.push('');
  }

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
