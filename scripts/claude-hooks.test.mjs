/**
 * End-to-end tests for the command hooks in `.claude/settings.json`.
 *
 * These hooks sat in the config for seven months doing nothing: bash syntax run
 * under `/bin/sh`, a file path read from an environment variable that does not
 * exist, and output in a JSON shape the harness discards. Nothing failed, so
 * nobody looked. Each hook is therefore exercised the way Claude Code runs it —
 * as a subprocess fed a real payload on stdin — rather than by reading the JSON.
 */

import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeEach, describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const hookDir = join(repoRoot, '.claude', 'hooks');

const BIOME_FORMAT = join(hookDir, 'post-edit-biome-format.mjs');
const TYPECHECK = join(hookDir, 'post-edit-typecheck.mjs');
const MDX_FRONTMATTER = join(hookDir, 'post-edit-mdx-frontmatter.mjs');
const MAIN_BRANCH_GUARD = join(hookDir, 'pre-edit-main-branch-guard.mjs');

/** A directory inside the repo, so Biome resolves the repo's own config. */
const tmpDir = mkdtempSync(join(repoRoot, '.claude-hook-test-'));

/** Throwaway project roots built by the typecheck tests, cleaned up at the end. */
const stubProjects = [];

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
  for (const dir of stubProjects) rmSync(dir, { recursive: true, force: true });
});

/**
 * Run a hook the way the harness does: payload on stdin, project root in the
 * environment, nothing tool-specific in the environment beyond that.
 *
 * The mixed key style below is Claude Code's, not a typo: the tool *input* is
 * the tool's own schema (`file_path`), while the tool *response* is the
 * harness's result object (`filePath`). Normalising either one would make the
 * payload agree with itself and disagree with production, which is the one
 * thing these tests exist to catch.
 */
function runHook(hook, { filePath, projectDir = tmpDir, stdin } = {}) {
  const payload = JSON.stringify({
    session_id: 'test',
    cwd: projectDir,
    hook_event_name: 'PostToolUse',
    tool_name: 'Write',
    tool_input: { file_path: filePath },
    tool_response: { type: 'update', filePath },
  });
  const result = spawnSync(process.execPath, [hook], {
    input: stdin ?? payload,
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

/** The `additionalContext` string a hook reported, or `null` if it said nothing. */
function reportedContext(result) {
  if (result.stdout.trim() === '') return null;
  return JSON.parse(result.stdout).hookSpecificOutput.additionalContext;
}

function fixture(name, contents) {
  const path = join(tmpDir, name);
  writeFileSync(path, contents);
  return path;
}

describe('every PostToolUse hook', () => {
  const hooks = [BIOME_FORMAT, TYPECHECK, MDX_FRONTMATTER];

  it.each(hooks)('parses under its own interpreter, not /bin/sh (%s)', (hook) => {
    const result = runHook(hook, { filePath: join(tmpDir, 'nothing-of-interest.txt') });
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });

  it.each(hooks)('stays quiet when the payload is unusable (%s)', (hook) => {
    expect(runHook(hook, { stdin: 'not json at all' }).status).toBe(0);
  });

  it.each(hooks)('stays quiet when the edited file is gone (%s)', (hook) => {
    const result = runHook(hook, { filePath: join(tmpDir, 'deleted.ts') });
    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
  });
});

describe('post-edit-biome-format', () => {
  beforeEach(() => {
    rmSync(join(tmpDir, 'sample.ts'), { force: true });
  });

  it('formats a TypeScript file and says so', () => {
    const path = fixture('sample.ts', 'export const   x=1\n');
    const result = runHook(BIOME_FORMAT, { filePath: path, projectDir: repoRoot });

    expect(result.status).toBe(0);
    expect(readFileSync(path, 'utf8')).toBe('export const x = 1;\n');
    expect(reportedContext(result)).toMatch(/reformatted/);
  });

  it('says nothing when the file was already formatted', () => {
    const path = fixture('sample.ts', 'export const x = 1;\n');
    const result = runHook(BIOME_FORMAT, { filePath: path, projectDir: repoRoot });

    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
  });

  it('ignores extensions Biome does not handle here', () => {
    const path = fixture('page.mdx', '---\ntitle: x\n---\n');
    const result = runHook(BIOME_FORMAT, { filePath: path, projectDir: repoRoot });

    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
    expect(readFileSync(path, 'utf8')).toBe('---\ntitle: x\n---\n');
  });
});

describe('post-edit-typecheck', () => {
  /**
   * A project whose local `tsc` is this shell script. Running the real compiler
   * costs ~12s, and what matters here is how its output is handled anyway.
   */
  function projectWithStubTsc(body) {
    const dir = mkdtempSync(join(tmpdir(), 'claude-hook-tsc-'));
    mkdirSync(join(dir, 'node_modules', '.bin'), { recursive: true });
    const tsc = join(dir, 'node_modules', '.bin', 'tsc');
    writeFileSync(tsc, `#!/bin/sh\n${body}\n`);
    chmodSync(tsc, 0o755);
    writeFileSync(join(dir, 'module.ts'), 'export const x = 1;\n');
    stubProjects.push(dir);
    return dir;
  }

  it('ignores files that are not TypeScript', () => {
    const path = fixture('styles.css', 'a { color: red; }\n');
    expect(runHook(TYPECHECK, { filePath: path }).stdout).toBe('');
  });

  it('does nothing when the project has no local tsc installed', () => {
    const path = fixture('module.ts', 'export const x = 1;\n');
    const result = runHook(TYPECHECK, { filePath: path });

    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
  });

  it('turns tsc colour off, or nothing will ever match "error TS"', () => {
    const dir = projectWithStubTsc('echo "$@" > "$0.args"');
    runHook(TYPECHECK, { filePath: join(dir, 'module.ts'), projectDir: dir });

    const args = readFileSync(join(dir, 'node_modules', '.bin', 'tsc.args'), 'utf8');
    expect(args).toContain('--pretty false');
  });

  it('reports the type errors tsc found without failing the tool call', () => {
    const dir = projectWithStubTsc(
      "echo \"src/a.ts(1,14): error TS2322: Type 'string' is not assignable to type 'number'.\"\n" +
        'echo "Found 1 error in src/a.ts"\n' +
        'exit 2'
    );
    const result = runHook(TYPECHECK, { filePath: join(dir, 'module.ts'), projectDir: dir });

    expect(result.status).toBe(0);
    expect(reportedContext(result)).toContain('TS2322');
    expect(reportedContext(result)).toContain('1 type error(s)');
  });

  it('stays quiet when tsc is clean', () => {
    const dir = projectWithStubTsc('exit 0');
    const result = runHook(TYPECHECK, { filePath: join(dir, 'module.ts'), projectDir: dir });

    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
  });
});

describe('post-edit-mdx-frontmatter', () => {
  it('blocks an MDX file with no frontmatter', () => {
    const path = fixture('missing.mdx', '# Just a heading\n');
    const result = runHook(MDX_FRONTMATTER, { filePath: path });

    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/does not start with YAML frontmatter/);
  });

  it('accepts an MDX file that opens with frontmatter', () => {
    const path = fixture('ok.mdx', '---\ntitle: Ok\ndescription: Fine\n---\n\nBody.\n');
    const result = runHook(MDX_FRONTMATTER, { filePath: path });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  it('ignores files that are not MDX', () => {
    const path = fixture('readme.md', '# Not MDX\n');
    expect(runHook(MDX_FRONTMATTER, { filePath: path }).status).toBe(0);
  });

  it('resolves a relative file path against the project directory', () => {
    fixture('relative.mdx', 'no frontmatter here\n');
    const result = runHook(MDX_FRONTMATTER, { filePath: 'relative.mdx' });

    expect(result.status).toBe(2);
  });
});

describe('pre-edit-main-branch-guard', () => {
  /**
   * One repository with two checkouts, `onMain` and `onFeature`, plus an
   * unrelated repository on `main`. The session's project is always the branched
   * checkout; what varies is where the shell sits and where the file is.
   */
  const root = mkdtempSync(join(tmpdir(), 'claude-hook-guard-'));
  const onMain = join(root, 'docs');
  const onFeature = join(root, 'docs-feature');
  const elsewhere = join(root, 'notes');

  /** Global and system config off, so a signing or hook setting cannot break setup. */
  const gitEnv = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };

  function git(dir, ...args) {
    const result = spawnSync(
      'git',
      ['-C', dir, '-c', 'user.name=test', '-c', 'user.email=test@example.com', ...args],
      { encoding: 'utf8', env: gitEnv }
    );
    if (result.status !== 0) throw new Error(`git ${args.join(' ')}: ${result.stderr}`);
  }

  function repositoryOnMain(dir) {
    mkdirSync(dir);
    git(dir, 'init', '--quiet', '--initial-branch=main');
    git(dir, 'commit', '--quiet', '--allow-empty', '--message=init');
    writeFileSync(join(dir, 'page.mdx'), '---\ntitle: x\n---\n');
  }

  repositoryOnMain(onMain);
  git(onMain, 'worktree', 'add', '--quiet', '-b', 'feature', onFeature);
  writeFileSync(join(onFeature, 'page.mdx'), '---\ntitle: x\n---\n');
  repositoryOnMain(elsewhere);

  afterAll(() => rmSync(root, { recursive: true, force: true }));

  function guard(filePath, { cwd = onFeature } = {}) {
    const result = spawnSync(process.execPath, [MAIN_BRANCH_GUARD], {
      input: JSON.stringify({
        session_id: 'test',
        cwd,
        hook_event_name: 'PreToolUse',
        tool_name: 'Write',
        tool_input: { file_path: filePath },
      }),
      cwd,
      encoding: 'utf8',
      env: { ...process.env, CLAUDE_PROJECT_DIR: onFeature },
    });
    return { status: result.status, stderr: result.stderr };
  }

  it('refuses a file in the checkout on main, from a shell in the branched one', () => {
    const result = guard(join(onMain, 'page.mdx'));
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/is on main/);
  });

  it('allows a file in the branched checkout, from a shell in the one on main', () => {
    expect(guard(join(onFeature, 'page.mdx'), { cwd: onMain }).status).toBe(0);
  });

  it('resolves a relative path against the project, not the shell', () => {
    expect(guard('page.mdx', { cwd: onMain }).status).toBe(0);
  });

  it('judges a file that does not exist yet by its nearest existing directory', () => {
    expect(guard(join(onMain, 'new', 'dir', 'page.mdx')).status).toBe(2);
    expect(guard(join(onFeature, 'new', 'dir', 'page.mdx'), { cwd: onMain }).status).toBe(0);
  });

  it('follows a symlink to the checkout its target is in', () => {
    const link = join(onFeature, 'linked.mdx');
    symlinkSync(join(onMain, 'page.mdx'), link);
    expect(guard(link).status).toBe(2);
  });

  it('follows a dangling symlink to where the write would create its target', () => {
    const link = join(onFeature, 'dangling.mdx');
    symlinkSync(join(onMain, 'not-yet', 'page.mdx'), link);
    expect(guard(link).status).toBe(2);
  });

  it('follows a symlinked directory', () => {
    const link = join(onFeature, 'linked-dir');
    symlinkSync(onMain, link);
    expect(guard(join(link, 'page.mdx')).status).toBe(2);
  });

  it('refuses a symlink loop rather than guessing', () => {
    const link = join(onFeature, 'loop.mdx');
    symlinkSync(link, link);
    expect(guard(link).status).toBe(2);
  });

  it('leaves another repository on main alone', () => {
    expect(guard(join(elsewhere, 'page.mdx')).status).toBe(0);
  });

  it('leaves a file outside any repository alone', () => {
    expect(guard(join(tmpdir(), 'claude-hook-guard-outside.txt')).status).toBe(0);
  });
});
