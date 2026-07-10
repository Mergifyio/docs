---
name: docs-from-code
description: >-
  Use the Mergify product source code (Mergifyio/monorepo) as the source of
  truth to verify or draft documentation. Use when checking whether a docs page
  matches how the product actually behaves, when a config key's default/enum/
  behavior needs confirming against the implementation, when the schema and
  changelog disagree, or when drafting docs for a feature from its code/PR. Two
  modes: verify (audit docs against code) and draft (generate a code-grounded
  first draft). Reads a temporary local clone of the engine (Python/pydantic) and
  dashboard. Composes with proofread-technical, document-a-feature, and
  docs-gap-analysis.
---

# Docs From Code

The changelog and the JSON schemas are *summaries* of the product; they omit
detail and they drift (the committed schema can lag the code). The engine source
is the only source of truth that cannot be stale. This skill reads that source to
**verify** docs against the real implementation and to **draft** docs grounded in
it.

## Shared core

Both modes start the same way. Read `references/monorepo-map.md` for the exact
clone command, repo layout, and where each doc concept lives in the code.

1. **Get the code.** Obtain a temporary shallow clone of `Mergifyio/monorepo`
   (see the map for the command). Reuse an existing fresh clone; refresh if
   stale. Never add it to the docs repo (it lives in a scratch dir).
2. **Locate the implementation.** Map the doc concept to its code:
   - config keys / defaults / enums → pydantic `Field(...)` in
     `engine/mergify_engine/rules/config/*.py`
   - actions → `engine/mergify_engine/workflow_automation/actions/`
   - behavior → the relevant engine module (queue, merge_protections, …)
   - dashboard / UI features → `dashboard/src/modules/*`

   Grep the clone to find the definition; the map lists the recipes.

## Mode: verify (audit docs against code)

Input: a docs page, or a specific config key / action / feature.

1. Locate the implementation (shared core).
2. Extract the **actual** default, enum values, required-ness, and behavior from
   the code — for config keys, read the pydantic `Field(default=..., description=...)`
   directly; that value is authoritative even when the committed schema disagrees.
3. Diff the code against what the docs claim.
4. Report each discrepancy as `docs <path:line>` vs `engine <path:line>` with the
   code value quoted. Fix clear, unambiguous doc errors directly; flag anything
   where the intent is uncertain rather than guessing.

This is `proofread-technical` upgraded from "matches the schema" to "matches the
implementation" — it catches defaults/enums that drifted from the code (the
`allow_checks_interruption` class of bug) at the source.

## Mode: draft (generate docs from code)

Input: a feature — a PR number, or a code area / config key.

1. Locate the implementation (shared core). If given a PR, also read its diff
   (`gh pr view <n> --repo Mergifyio/monorepo --json title,body,files` +
   `gh pr diff`).
2. Extract the user-facing surface from the code: config keys and their
   defaults/enums, behavior, edge cases, validation errors, and any user-visible
   messages. Translate code truth into a **user-facing lens** — document what the
   user configures and observes, not engine internals.
3. Produce a first-draft page (prose + valid config examples).
4. Hand the draft to the **document-a-feature** skill for placement, component
   selection, and site plumbing, then run the proofread pipeline and
   **validate-config-examples**.

## Composition

- `docs-gap-analysis` finds a gap → **draft** writes a code-grounded first pass →
  `document-a-feature` structures and wires it → proofread + `pnpm check`.
- **verify** runs standalone, or as the deep technical dimension behind
  `proofread-technical` when a claim must be checked against behavior, not just
  the schema.

## Guardrails

- The clone is read-only and disposable — never edit it, never commit it into the
  docs repo, never add it to `.gitignore` (keep it in the scratch dir).
- Document the user-facing contract, not implementation details. Code is the
  source of truth for *what is true*, not for *how to say it*.
- When code and a doc disagree, the code wins for facts (defaults, enums,
  behavior) — but if you cannot tell whether a difference is intentional, flag it
  rather than "fixing" it.
- Never touch `src/content/changelog/`.
- The monorepo is large; scope greps to the concept at hand (one key/action),
  don't bulk-read.
