---
name: validate-config-examples
description: >-
  Validate Mergify YAML configuration examples embedded in the docs against the
  real Mergify schema, so broken config snippets never ship. Use after editing
  docs pages that contain .mergify.yml / YAML examples, when reviewing a docs PR
  with config snippets, or when asked to check/validate config examples in the
  docs. Extracts YAML code fences, classifies them, and validates full Mergify
  configs with `mergify config validate` (optionally via the mergify:mergify-config
  skill when that plugin is installed).
---

# Validate Config Examples

Mergify config snippets in the docs are the most-copied content on the site. A
broken example erodes trust instantly. This skill finds every YAML example and
validates the ones that are real Mergify configs.

## Workflow

1. **Pick the scope.**
   - Reviewing a change: run against the changed MDX files only.
   - Auditing: run against the whole `src/content/docs/` tree.

2. **Extract and classify** with the bundled script:

   ```bash
   .claude/skills/validate-config-examples/scripts/extract_yaml.py <files-or-dir>
   ```

   It prints a JSON array of every YAML fence with `file`, `line`,
   `classification`, and `code`. Classifications:

   | Classification | Meaning | Action |
   | --- | --- | --- |
   | `mergify-config` | A real Mergify config (has top-level keys like `queue_rules`, `pull_request_rules`, `merge_protections`) | **Validate it** |
   | `github-actions` | A CI workflow YAML, not Mergify config | Skip |
   | `partial` | Marked `# partial` or a fragment (no top-level key) | Skip validation |
   | `unknown` | YAML that fits none of the above | Eyeball manually |

3. **Validate each `mergify-config` snippet** with `mergify config validate` —
   the authoritative validator (it understands condition syntax and action
   options, not just the JSON shape). Write each snippet to a temp file and pass
   it with `--config-file` (the command auto-detects `.mergify.yml` from the
   current directory otherwise, so the flag is required for a temp file):

   ```bash
   printf '%s\n' "$CODE" > /tmp/mergify-example.yml
   mergify config validate --config-file /tmp/mergify-example.yml
   ```

   If the **mergify:mergify-config** plugin skill is installed, you can invoke it
   instead of calling the CLI directly — it wraps the same command. As a
   structural fallback when the CLI is unavailable, validate against
   `public/mergify-configuration-schema.json` (JSON Schema).

4. **Report** each failure as `file:line — <error>`. Fix clear errors directly in
   the MDX (wrong key name, bad indentation, invalid condition). For anything
   ambiguous, flag rather than guess — a wrong "fix" to a config example is worse
   than a flagged one.

## The fragment convention

Many doc examples are partial on purpose — they show one rule, not a whole file.
A bare fragment cannot be validated standalone and will false-positive.

The script treats a snippet as `partial` (and skips it) when:

- it has no unindented top-level key (it is clearly a fragment), or
- its first lines contain a `# partial` marker comment.

When you intentionally show a fragment that the script can't auto-detect, add a
leading `# partial` comment to the code block so it is skipped cleanly. Do not add
the marker to examples that are meant to be complete, valid configs — those should
validate.

## Scope & guardrails

- Only validates YAML/`yml` fences; ignores all other languages.
- Skips GitHub Actions and other non-Mergify YAML automatically.
- Never edits `src/content/changelog/`.
- Fix only genuine errors; leave valid examples alone even if you'd phrase the
  surrounding prose differently.
