/**
 * Shared plumbing for the `PostToolUse` command hooks declared in
 * `.claude/settings.json`.
 *
 * Claude Code passes a hook its payload as JSON on stdin and sets no
 * tool-specific environment variables — there is no `$CLAUDE_TOOL_INPUT_FILE_PATH`.
 * It also runs `type: "command"` hooks under `/bin/sh`, which is dash on Linux,
 * so a hook body cannot use bash syntax. Both are why these hooks are scripts
 * with their own shebang instead of shell one-liners inside the JSON config.
 */

import { existsSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

/** Read and parse the hook payload from stdin. Returns `{}` if it is unusable. */
export async function readHookPayload() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return {};
  }
}

/**
 * Absolute path of the file the Edit/Write tool just touched, or `null` when the
 * payload carries no path or the file is gone (an Edit that deleted it, say).
 */
export function editedFile(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (typeof filePath !== 'string' || filePath === '') return null;
  const absolute = isAbsolute(filePath) ? filePath : resolve(projectDir(payload), filePath);
  return existsSync(absolute) ? absolute : null;
}

/** Repository root, for resolving relative paths and locating local binaries. */
export function projectDir(payload) {
  return process.env.CLAUDE_PROJECT_DIR || payload?.cwd || process.cwd();
}

/** `file` relative to the repo root, or absolute when it sits outside it. */
export function displayPath(payload, file) {
  const relativePath = relative(projectDir(payload), file);
  return relativePath.startsWith('..') ? file : relativePath;
}

/** Does `file` end in one of `extensions` (given without the leading dot)? */
export function hasExtension(file, extensions) {
  const match = /\.([^./\\]+)$/.exec(file);
  return match !== null && extensions.includes(match[1].toLowerCase());
}

/**
 * Tell Claude something without flagging the tool call as failed.
 *
 * `hookSpecificOutput.additionalContext` is the only channel that reaches the
 * model on a successful hook: a bare `{"feedback": ...}` blob — what these hooks
 * printed before — is read by nothing and discarded.
 */
export function report(message) {
  process.stdout.write(
    `${JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: message,
      },
    })}\n`
  );
  process.exit(0);
}

/**
 * Flag a problem Claude has to deal with. Exit code 2 is what makes the harness
 * surface stderr to the model; the write itself has already landed on disk.
 */
export function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

/** Path of a binary in the repo's `node_modules/.bin`, or `null` if not installed. */
export function localBin(payload, name) {
  const bin = resolve(projectDir(payload), 'node_modules', '.bin', name);
  return existsSync(bin) ? bin : null;
}
