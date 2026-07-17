---
name: validate-config-examples
description: >-
  Validate Mergify YAML configuration examples embedded in the docs against the
  real Mergify config JSON Schema, so broken config snippets never ship. Use
  after editing docs pages that contain .mergify.yml / YAML examples, when
  reviewing a docs PR with config snippets, or when asked to check/validate
  config examples in the docs. Runs `pnpm check:config-examples`, which extracts
  every YAML fence, classifies it, and validates the complete Mergify configs
  against public/mergify-configuration-schema.json.
---

# Validate Config Examples

Mergify config snippets in the docs are the most-copied content on the site. A
broken example erodes trust instantly. A `config-examples` CI job validates them
on every PR; this skill is how you run the same check locally and fix what it
finds.

## Run it

```bash
pnpm check:config-examples          # validate everything under src/content/docs
```

Under the hood this runs `node scripts/validate-config-examples.mjs`. It scans
MDX for ```yaml / ```yml fences, classifies each, YAML-parses the complete
Mergify configs, and validates them against `public/mergify-configuration-schema.json`
with [Ajv](https://ajv.js.org/). Exit code is non-zero if any example is invalid;
each failure prints as `file:line — <error>`.

To validate only the files you touched, pass paths:

```bash
node scripts/validate-config-examples.mjs src/content/docs/merge-queue
```

To inspect the classification (which blocks are validated vs skipped and why),
use `--json`:

```bash
node scripts/validate-config-examples.mjs --json src/content/docs | jq '.[] | {file, line, classification}'
```

## What gets validated vs skipped

The script validates a block only when it is a **complete** Mergify config —
i.e. it has an unindented top-level key from the config schema (`queue_rules`,
`pull_request_rules`, `merge_protections`, `merge_protections_settings`,
`scopes`, `defaults`, `commands_restrictions`, `extends`, `shared`, ...).

It automatically **skips**:

- **Fragments** — a snippet with no top-level key (e.g. a single rule or a bare
  list of conditions shown inline). Cannot be validated as a whole config.
- **`...` placeholders** — any block containing a bare `...` line is treated as
  deliberately incomplete.
- **GitHub Actions / other CI YAML** — detected by `on:` + `jobs:`/`steps:`/etc.
- **Anything marked `# partial`** in its first lines.

For a block that *looks* like a full config but should not be validated — most
often **deprecated syntax shown in a migration guide** — put a reader-invisible
MDX comment on the line before the fence:

````mdx
{/* validate-config-examples: skip — deprecated partition_rules syntax, shown for migration */}

```yaml
partition_rules:
  ...
```
````

Do **not** skip a block just to make CI pass. If an example is meant to be a
real, copy-pasteable config, fix it instead.

## Fixing failures

- **`invalid YAML: ...`** — the snippet isn't valid YAML. The most common cause
  is an unquoted Mergify template at the start of a value (`{{ ... }}` or a
  leading `@`): `message: @{{author}} ...` must be `message: "@{{author}} ..."`,
  and `bot_account: {{ author }}` must be `bot_account: "{{ author }}"`.
- **`/ must NOT have additional properties`** — an unknown or misspelled key at
  the top level (or a deprecated top-level key). Fix the key, or mark the block
  skipped if the old syntax is shown on purpose.
- **`/path must be <type>`** — a value has the wrong type or shape. Match the
  schema.

Fix clear errors directly in the MDX. For anything ambiguous, flag it rather than
guess — a wrong "fix" to a config example is worse than a flagged one.

## Scope, guardrails & limitations

- Validation is **structural** (keys, types, shapes). It does **not** check the
  semantics of condition expressions (`base=main`), nor Mergify's custom string
  formats (`duration`, `template`) — a generic JSON-Schema `duration` validator
  would wrongly reject valid values like `checks_timeout: 5 min`, so all `format`
  keywords are intentionally ignored. For deep semantic validation of a single
  config, `mergify config validate --config-file <file>` (the **mergify:mergify-config**
  skill) remains authoritative — but it fetches the schema from docs.mergify.com,
  so it is not used in CI.
- The schema at `public/mergify-configuration-schema.json` is kept fresh by an
  automated sync ("chore: sync Mergify JSON Schema files"); the check always runs
  against the copy in the repo, so a PR is validated against its own schema.
- Only `yaml`/`yml` fences are considered. Never edits `src/content/changelog/`.
- Fix only genuine errors; leave valid examples alone.
