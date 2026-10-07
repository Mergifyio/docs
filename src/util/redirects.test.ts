import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '../..');
const DOCS = join(ROOT, 'src/content/docs');

interface Rule {
  from: string;
  to: string;
}

const rules: Rule[] = readFileSync(join(ROOT, 'public/_redirects'), 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))
  .map((line) => {
    const [from, to] = line.split(/\s+/);
    return { from, to };
  });

/**
 * Where Cloudflare Pages sends `path`, or null when no rule matches. An exact
 * rule beats a splat one, and among rules of a kind the top-most wins.
 */
function resolve(path: string): string | null {
  const exact = rules.find((rule) => rule.from === path);
  if (exact) return exact.to;
  for (const { from, to } of rules) {
    if (!from.endsWith('/*')) continue;
    const prefix = from.slice(0, -1);
    if (path.startsWith(prefix) && path.length > prefix.length) {
      return to.replace(':splat', path.slice(prefix.length));
    }
  }
  return null;
}

/** Whether the built site serves `url`, read from the content it is built from. */
function serves(url: string): boolean {
  const path = url.split('#')[0];
  const md = path.endsWith('.md');
  const slug = path.replace(/\.md$/, '').replace(/^\/|\/$/g, '');
  if (md) return existsSync(join(DOCS, `${slug}.mdx`));
  return existsSync(join(DOCS, `${slug}.mdx`)) || existsSync(join(DOCS, slug, 'index.mdx'));
}

function testEngineSlugs(): string[] {
  const dir = join(DOCS, 'test-engine');
  const slugs = (readdirSync(dir, { recursive: true }) as string[])
    .filter((file) => file.endsWith('.mdx'))
    .filter((file) => !file.split('/').some((part) => part.startsWith('_')))
    .map((file) => relative(DOCS, join(dir, file)).replace(/\.mdx$/, ''));
  return ['test-engine', ...slugs];
}

// The docs moved from /test-insights to /test-engine, and dashboard links,
// package homepages and search engines still carry the old URLs.
describe('/test-insights redirects', () => {
  const pages = testEngineSlugs();

  it('finds the pages it checks', () => {
    expect(pages).toContain('test-engine/test-frameworks/pytest');
  });

  for (const slug of pages) {
    const old = `/${slug.replace(/^test-engine/, 'test-insights')}`;
    for (const url of [old, `${old}/`, `${old}.md`]) {
      it(`sends ${url} to the page that replaced it`, () => {
        const target = resolve(url);
        expect(target).not.toBeNull();
        expect(target?.replace(/\.md$/, '').replace(/\/$/, '')).toBe(`/${slug}`);
        expect(serves(target as string)).toBe(true);
      });
    }
  }

  it.each([
    ['/test-insights/mitigation', '/test-engine/quarantine'],
    ['/test-insights/mitigation/', '/test-engine/quarantine'],
    ['/test-insights/mitigation.md', '/test-engine/quarantine.md'],
    ['/test-engine/mitigation', '/test-engine/quarantine'],
    ['/test-engine/mitigation.md', '/test-engine/quarantine.md'],
    ['/test-insights/test-frameworks/', '/test-engine#test-framework-configuration'],
    ['/test-insights/cli', '/cli/tests'],
    ['/ci-insights/quarantine/', '/test-engine/quarantine'],
    ['/ci-insights/test-frameworks/', '/test-engine#test-framework-configuration'],
    ['/ci-insights/test-frameworks/pytest/', '/test-engine/test-frameworks/pytest/'],
  ])('sends %s to %s', (from, to) => {
    expect(resolve(from)).toBe(to);
  });

  it('sends nothing to a /test-insights page, which would cost a second hop', () => {
    expect(rules.filter(({ to }) => to.startsWith('/test-insights'))).toEqual([]);
  });
});
