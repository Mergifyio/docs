/**
 * End-to-end tests for the `PostToolUse` hooks in `.claude/settings.json`.
 *
 * These hooks sat in the config for seven months doing nothing: bash syntax run
 * under `/bin/sh`, a file path read from an environment variable that does not
 * exist, and output in a JSON shape the harness discards. Nothing failed, so
 * nobody looked. Each hook is therefore exercised the way Claude Code runs it —
 * as a subprocess fed a real payload on stdin — rather than by reading the JSON.
 */

import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeEach, describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const hookDir = join(repoRoot, '.claude', 'hooks');

const BIOME_FORMAT = join(hookDir, 'post-edit-biome-format.mjs');
const TYPECHECK = join(hookDir, 'post-edit-typecheck.mjs');
const MDX_FRONTMATTER = join(hookDir, 'post-edit-mdx-frontmatter.mjs');

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
