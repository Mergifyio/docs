---
name: docs-gap-analysis
description: >-
  Find undocumented or stale Mergify features by comparing what the product
  shipped against what the docs cover. Use when asked what is missing from the
  docs, to audit docs coverage, to find undocumented features, to check whether
  recent features/PRs are documented, or to plan documentation work. Gathers
  shipped-feature signal from merged PRs, Linear, and the changelog, maps it
  against src/content/docs/, and produces a prioritized gap report that feeds the
  document-a-feature skill.
---

# Docs Gap Analysis

Docs rot silently: the product ships, the docs don't follow, and nobody notices
until a customer does. This skill surfaces the gap so it can be closed.

The output is a prioritized report. Each item is shaped to hand straight to the
**document-a-feature** skill.

## Workflow

Create a todo for each step.

1. **Set the window.** Default to the last 90 days unless the user gives a range.
   Convert to absolute dates.

2. **Gather shipped-feature signal.** Read `references/signal-sources.md` for
   exactly where to look and which tools to use. In short, pull from:
   - **Changelog** (primary) — `src/content/changelog/` entries: the curated,
     confirmed list of announced user-facing changes. Highest signal per token.
     Read-only — NEVER edit these files.
   - **Merged PRs** (supplementary) in `Mergifyio/monorepo` via `gh` — to catch
     unannounced changes and get a specific feature's exact surface. The monorepo
     is too active to enumerate fully; spot-check, don't sweep.
   - **Linear** — completed issues/projects via the Linear MCP tools, for the
     "why" framing.

3. **Build a feature inventory.** Distill the signal into discrete, user-facing
   capabilities. Drop pure refactors, internal-only changes, and bug fixes that
   don't change documented behavior. For each capability note: name, the surface
   it touches (config key / action / CLI / API / dashboard), and the source link.

4. **Map against the docs.** For each capability, search `src/content/docs/`:
   - `grep -ri "<feature name / config key / action>" src/content/docs/`
   - Config/CLI options: `OptionsTable` / `CliCommand` render from the live
     schema, so a key may show in a table while its prose context is missing —
     that still counts as a gap (prose needed).
   - **API endpoints are the exception**: the `/api` reference auto-renders every
     path in `public/api-schemas.json`, so an endpoint present there is already
     documented — do NOT flag it as undocumented. See `references/signal-sources.md`.

5. **Classify each capability:**
   - **Undocumented** — no meaningful coverage anywhere.
   - **Partial** — mentioned but missing setup, options, or context.
   - **Stale** — documented, but the behavior described predates a change (the
     PR/changelog says it changed; the docs still describe the old behavior).
   - **Covered** — adequately documented (omit from the action list, count only).

6. **Produce the report.** Prioritize by reader impact: customer-facing config /
   merge-queue / protections behavior first; niche or advanced last. For each gap
   give: capability, classification, the source link, the target docs page (or
   "new page in `<section>/`"), and a one-line suggested action. Consider pushing
   the report to the hublot kiosk for review.

## Report format

```
## Docs Gap Report — <date range>

### Undocumented (N)
- <capability> — <surface> — src: <PR/Linear/changelog link>
  → suggest: new page in <section>/ (use document-a-feature)

### Partial (N)
- <capability> — missing <what> on <page path>
  → suggest: extend <page path>

### Stale (N)
- <capability> — <page path> describes old behavior; changed in <link>
  → suggest: update <page path>

### Covered: N capabilities (no action)
```

## Guardrails

- Read-only on `src/content/changelog/` — it's a signal source, never an edit
  target.
- Don't flag internal/refactor PRs as doc gaps. Only user-facing capability
  changes count.
- Be honest about uncertainty: if you can't tell whether something is documented,
  say "needs review" rather than asserting a gap.
- The output is a plan, not edits. To actually write a page, hand the item to
  document-a-feature.
