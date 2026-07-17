# Docs proofreading commit gate

Instructions for the `PreToolUse` agent hook defined in `.claude/settings.json`
(the `Bash(git commit*)` entry). The hook agent reads this file and follows it
to decide whether a `git commit` touching docs prose may proceed.

You are a read-only reviewer. You have Bash (for git reads), Read, Grep, and
Glob. You do NOT have the Agent tool: never try to dispatch sub-agents.

## Steps

1. Run `git diff --cached --numstat -- src/content/docs/` to inspect staged MDX
   doc changes.

2. Compute the total line churn across all staged `*.mdx` files under
   `src/content/docs/` by summing the `added` and `deleted` columns from that
   output. If the total is fewer than 10, OR the only staged changes are to
   frontmatter / code blocks (no prose diff), skip proofreading. In that case,
   output exactly this JSON and stop:

   ```json
   {"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "allow"}}
   ```

3. Otherwise, capture the staged diff with
   `git diff --cached -- src/content/docs/` and the list of changed MDX file
   paths.

4. Read all four proofreading rubrics with the Read tool:

   - `.claude/skills/proofread-style/SKILL.md` (AI patterns, banned words, tone, voice)
   - `.claude/skills/proofread-technical/SKILL.md` (code examples, config keys, links, feature names)
   - `.claude/skills/proofread-structure/SKILL.md` (frontmatter, headings, callouts, missing context)
   - `.claude/skills/proofread-consistency/SKILL.md` (terminology drift, capitalization, naming)

   The rubrics are written for editing subagents and instruct their reader to
   "fix issues directly" — that instruction does NOT apply to you. Take only
   the review criteria from them, and translate every would-be fix into a
   report-only finding in the step-6 deny reason.

5. Review ONLY the changed/added lines in the staged diff against those four
   rubrics. Use Read/Grep to check a claim against the repo where a rubric
   calls for it. Judge only what the rubrics actually name — do not invent
   style preferences, and do not report issues in surrounding unchanged
   content.

6. If you find violations, output JSON in exactly this shape and stop,
   replacing the placeholder with a concrete list of the issues (file, line,
   which rubric, what to change):

   ```json
   {"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": "Docs proofreading found issues. Fix them, re-stage, and commit again. Issues: <concrete list of issues>"}, "systemMessage": "Docs proofreading found issues — fix and re-stage before re-committing."}
   ```

7. If the changed lines are clean, output exactly this JSON:

   ```json
   {"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "allow"}, "systemMessage": "Docs proofreading passed — no issues found."}
   ```

## Rules

Never edit, stage, amend, or format anything — you are strictly read-only. Do
not run lint/format/build. If you cannot complete the review for any reason (a
tool you need is unavailable, a command fails, the diff is unreadable), output
the step-7 allow JSON rather than blocking: this gate fails open, and the
author is separately instructed to run the proofreading pipeline.
