# Monorepo Navigation Map

Where documented concepts live in `Mergifyio/monorepo`, and how to extract the
truth from the code.

## Table of contents

- [Get the code](#get-the-code)
- [Repo layout](#repo-layout)
- [Config keys, defaults, enums](#config-keys-defaults-enums)
- [Actions](#actions)
- [Behavior](#behavior)
- [Dashboard / UI](#dashboard--ui)
- [Grep recipes](#grep-recipes)

## Get the code

Shallow, single-branch clone into a scratch dir (never inside the docs repo).
Reuse if it already exists and is fresh; otherwise refresh.

```bash
CLONE="${TMPDIR:-/tmp}/mergify-monorepo"
if [ -d "$CLONE/.git" ]; then
  git -C "$CLONE" fetch --depth 1 origin main && git -C "$CLONE" reset --hard origin/main
else
  git clone --depth 1 --single-branch --branch main \
    https://github.com/Mergifyio/monorepo.git "$CLONE"
fi
```

Read-only and disposable. Do not edit it, commit it, or reference it from the
docs repo.

## Repo layout

Top level (the two that matter for docs):

- `engine/` — the product engine (Python). The behavioral source of truth:
  config models, defaults, actions, queue/merge logic.
- `dashboard/` — the web dashboard (TypeScript/React). UI-only features
  (Activity Log, adoption tabs, in-app editors) live here.

## Config keys, defaults, enums

Config is defined with **pydantic models** under
`engine/mergify_engine/rules/config/`. Each key is a `pydantic.Field(...)` whose
`default=` and `description=` are authoritative — the committed
`public/mergify-configuration-schema.json` is *generated from these models*, so
when the schema (or a changelog) disagrees with the docs, the `Field` in code is
the tiebreaker.

Modules by area:

Paths below are full, relative to the clone root.

| Concept | Module |
| --- | --- |
| Queue rules (`queue_rules`) — `max_checks_retries`, `checks_timeout`, `batch_size`, `merge_method`, … | `engine/mergify_engine/rules/config/queue_rules.py` |
| Global `merge_queue` settings — `status_comments`, capacities, … | `engine/mergify_engine/rules/config/merge_queue.py` |
| Priority rules — `allow_checks_interruption`, `priority`, … | `engine/mergify_engine/rules/config/priority_rules.py` |
| Merge protections | `engine/mergify_engine/rules/config/merge_protections.py`, `engine/mergify_engine/rules/config/merge_protection_rules.py` |
| Pull request rules | `engine/mergify_engine/rules/config/pull_request_rules.py` |
| Scopes | `engine/mergify_engine/rules/config/scopes.py` |
| Commit message format | `engine/mergify_engine/rules/config/commit_message.py` |
| Command restrictions | `engine/mergify_engine/rules/config/commands_restrictions.py` |
| Global defaults | `engine/mergify_engine/rules/config/defaults.py` |

To read a key's real default/description:

```bash
grep -n -A6 "max_checks_retries" "$CLONE/engine/mergify_engine/rules/config/queue_rules.py"
```

Look for the `pydantic.Field(default=..., description="...")`. The `default=` is
the current runtime default; the `description=` is what feeds the schema and is
often close to doc-ready prose (but write for the reader, not copy verbatim).

## Actions

Each documented action in `src/content/docs/workflow/actions/<name>.mdx` maps 1:1
to `engine/mergify_engine/workflow_automation/actions/<name>.py` (e.g. `merge.py`,
`rebase.py`, `comment.py`, `backport.py`, `copy.py`, `label.py`, `squash.py`,
`update.py`, `post_check.py`, `delete_head_branch.py`). The action's option model
(pydantic) in that file gives its real parameters, defaults, and deprecations
(look for `deprecated=True`).

## Behavior

For "what actually happens" (not just config shape), read the engine logic:

- Merge queue lifecycle / batches / checks → `engine/mergify_engine/queue/…`
- Merge protections behavior → `engine/mergify_engine/merge_protections/…`
- Conditions / attributes → `engine/mergify_engine/rules/…`

Start from the config model that references the behavior, then follow the imports.

## Dashboard / UI

UI-only features (no config key) live in `dashboard/src/modules/<feature>/`. Use
these to confirm what a dashboard screen shows, but remember these pages usually
still need a screenshot pass (see the `capture-screenshots` skill) — code tells
you the fields, not the pixels.

## Grep recipes

```bash
# Where is a config key defined / defaulted?
grep -rn "<key>" "$CLONE/engine/mergify_engine/rules/config/"

# A key's default + description block
grep -n -A6 "<key>" "$CLONE/engine/mergify_engine/rules/config/<module>.py"

# An action's parameters and deprecations
grep -n -E "Field\(|deprecated" "$CLONE/engine/mergify_engine/workflow_automation/actions/<action>.py"

# Anything, anywhere (scoped)
grep -rn "<term>" "$CLONE/engine/mergify_engine/"
```
