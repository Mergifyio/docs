---
name: screenshot-scenarios
description: >-
  Produce meaningful Mergify dashboard screenshots for the docs by staging a real
  product state in the mergify-sandbox org, capturing it, then cleaning up. Use
  when a docs page needs a screenshot that shows an actual state (a queue with PRs,
  a batch, a freeze, priority ordering), when auditing which pages are missing or
  have stale screenshots, or when asked to build a scenario and screenshot it. Sets
  up state via the sandbox-org skill, captures via the capture-screenshots skill,
  and tears the scenario down. Defers CI/Test Insights shots (they need real CI
  data). Composes with capture-screenshots, document-a-feature, docs-gap-analysis.
---

# Screenshot Scenarios

A dashboard screenshot is only useful if the UI shows something worth seeing. An
empty queue view teaches nothing. This skill **stages a real state** in a sandbox
repo, captures it with `capture-screenshots`, and tears it back down.

Two skills do the heavy lifting; this one is the layer above them — *what state
to produce, and where the shot belongs*:

- **sandbox-org** (mergify-internal plugin) drives the sandbox: it creates the
  repo, pushes config, opens PRs, queues, freezes, waits for the queue to settle,
  and cleans up. See `references/sandbox.md` for how this skill uses it.
- **capture-screenshots** is the mechanical capture (navigate → capture → save →
  emit `<Image>`).

## Prerequisites

- Logged into `app.mergify.com` in Chrome (for capture — see `capture-screenshots`).
- The **sandbox-org** skill available (mergify-internal plugin) — it provides the
  `sandbox.sh` commands used throughout — and `gh` + the `mergify` CLI it uses,
  authenticated as an admin of the `mergify-sandbox` org.
- The scenario repo created and Mergify-enabled. See `references/sandbox.md`.

## Two entry points

- **Coverage sweep** — find docs pages that describe a dashboard feature but have
  no screenshot or a stale one, and map each to a scenario. This is the
  visual-focused cousin of `docs-gap-analysis`. See [Coverage](#coverage).
- **Targeted** — you already know the shot you need; pick or build its recipe.

## Workflow (per screenshot)

Create a todo per step.

1. **Pick the recipe.** Read `references/scenario-recipes.md`. If a recipe fits,
   use it. If not, build a custom one following [Building a scenario](#building-a-custom-scenario).
2. **Stage the state** with the **sandbox-org** skill's staging verbs
   (`push-config` → `open-pr` → `queue` → optionally `freeze`, then `wait-queued`
   to poll until the target state settles). `references/sandbox.md` maps each
   recipe step to the exact `sandbox.sh` command.
3. **Capture.** Invoke the **capture-screenshots** skill with the recipe's
   dashboard URL and framing. It saves to the right `images/` dir and emits the
   `<Image>` snippet.
4. **Clean up** (always). `sandbox.sh cleanup <repo>` closes the scenario PRs and
   deletes their branches; `sandbox.sh unfreeze <repo>` lifts any freeze. Leave
   the sandbox at baseline.
5. **Wire it in.** Drop the snippet into the page, or hand off to
   `document-a-feature` if this is part of a new feature page.

## Building a custom scenario

When no recipe fits, define one by answering four questions, then add it to
`references/scenario-recipes.md` so it is reusable:

1. **What must the shot show?** The exact UI state (e.g. "two PRs in one batch").
2. **What produces that state?** The minimal `.mergify.yml` + the PRs/actions
   needed (open N PRs, queue them, add a label, create a freeze…).
3. **How do I know it's ready?** The poll/wait condition (e.g. queue shows 2 PRs
   with a shared batch id) — never screenshot before the state has settled.
4. **Where is it captured?** The dashboard URL and the region to frame.

## Coverage

To find where screenshots are missing or stale:

- Grep docs for pages that describe a dashboard/UI action but import no image:
  a page under `src/content/docs/` whose prose says "in the dashboard" / "the
  queue view" / "the statistics page" but has no `<Image>` is a candidate.
- Cross-check existing `src/content/docs/images/**` against the pages that use
  them; flag images that predate a feature change (a stale-shot candidate).
- Produce a prioritized list, each mapped to a recipe, and work it with the
  per-screenshot workflow above.

## Composition

`docs-gap-analysis` / coverage finds the need → **screenshot-scenarios** stages
and captures it → `capture-screenshots` does the mechanical capture →
`document-a-feature` places it.

## Guardrails

- **Sandbox only.** All staging goes through the sandbox-org skill, which refuses
  any repo outside the `mergify-sandbox` org — so a scenario can never mutate a
  real repo. Never screenshot another customer's data.
- **Always clean up**, even on failure — leave the sandbox at baseline so the next
  run starts clean.
- **Poll, don't guess** — `wait-queued` before capturing; a half-formed queue
  makes a misleading shot.
- **Defer CI / Test Insights** shots for now: they need real CI runs and test
  results, which this sandbox flow does not stage. Focus on merge-queue,
  merge-protections, freeze, and priority states.
- Stop and ask if the sandbox setup or the queue won't reach the target state
  after a couple of attempts. Don't loop.
