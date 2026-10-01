#!/usr/bin/env node
/**
 * PreToolUse(Edit|Write): refuse to write a file of this repository while the
 * checkout holding it is on `main`.
 *
 * The branch is read from the checkout that owns the file, not from the shell's
 * working directory. A session that `cd`s into a sibling checkout on `main` to
 * read it (the docs agent verifies claims against `../monorepo`) otherwise has
 * every later edit to this branched checkout refused, while an edit to a docs
 * checkout on `main` passes as long as the shell sits in a branched one.
 *
 * Files of other repositories are not guarded: this repository's settings have
 * no say over how those are worked on, and some (a coordination repo holding
 * notes, say) are edited on `main` by design.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readlinkSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';

import { projectDir, readHookPayload } from './hook-io.mjs';

/** More links than this in one chain is a loop; the kernel gives up near here too. */
const MAX_LINK_HOPS = 40;

function git(dir, ...args) {
  const result = spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8' });
  return result.error || result.status !== 0 ? null : result.stdout.trim();
}

/** Every worktree of a repository shares one common dir, so it names the repository. */
function repositoryOf(dir) {
  return git(dir, 'rev-parse', '--path-format=absolute', '--git-common-dir');
}

/**
 * The directory a write to `path` actually lands in, following symlinks the way
 * the write will. A link in a branched checkout can point into a checkout on
 * `main`, so the link's own directory is the wrong one to ask git about.
 *
 * Returns `null` for a link chain that never ends.
 */
function landingDir(path, hops = 0) {
  try {
    return dirname(realpathSync(path));
  } catch {
    // Missing, or a link whose target is missing: handled below.
  }

  let target = null;
  try {
    target = readlinkSync(path);
  } catch {
    // Not a link: a plain file that does not exist yet.
  }
  if (target !== null) {
    if (hops >= MAX_LINK_HOPS) return null;
    // A dangling link: the write creates its target, wherever that is.
    return landingDir(resolve(realpathSync(dirname(path)), target), hops + 1);
  }

  // A Write may create the file and its parent directories, so start from the
  // nearest directory that already exists.
  let dir = dirname(path);
  while (!existsSync(dir) && dirname(dir) !== dir) dir = dirname(dir);
  return realpathSync(dir);
}

const payload = await readHookPayload();
const filePath = payload?.tool_input?.file_path;

const dir =
  typeof filePath === 'string' && filePath !== ''
    ? landingDir(isAbsolute(filePath) ? filePath : resolve(projectDir(payload), filePath))
    : projectDir(payload);

if (dir === null) {
  process.stderr.write(`Cannot edit ${filePath}: it is a symlink loop.\n`);
  process.exit(2);
}

const repository = repositoryOf(dir);
if (repository === null || repository !== repositoryOf(projectDir(payload))) process.exit(0);

if (git(dir, 'branch', '--show-current') === 'main') {
  process.stderr.write(
    `Cannot edit files on the main branch: ${git(dir, 'rev-parse', '--show-toplevel') ?? dir} ` +
      'is on main. Create a feature branch first: ' +
      'git checkout -b your-branch-name --track origin/main\n'
  );
  process.exit(2);
}
