# Scenario Recipes

A library of repeatable states to stage in the `mergify-sandbox` scenario repo,
capture, and tear down. Each recipe names the config, the PRs/actions, the wait
condition, and the capture view. Drive them via the sandbox-org skill (see
`references/sandbox.md` for the step → command mapping); capture with the
`capture-screenshots` skill; always run the standard cleanup afterward.

Dashboard URLs follow the pattern
`https://app.mergify.com/github/mergify-sandbox/dashboard-scenarios/<view>` —
confirm the exact path from the app (see `capture-screenshots`' conventions).

## Table of contents

- [Recipe format](#recipe-format)
- [Queue with multiple PRs](#queue-with-multiple-prs)
- [Batch of PRs](#batch-of-prs)
- [Priority ordering](#priority-ordering)
- [Active freeze](#active-freeze)
- [A queued PR's check run](#a-queued-prs-check-run)
- [Paused queue](#paused-queue)

## Recipe format

- **Goal** — what the shot must show.
- **Serves** — the docs page(s) it illustrates.
- **Config** — `.mergify.yml` pushed to `main` for the scenario.
- **Stage** — PRs/actions to create.
- **Wait** — the poll condition before capturing.
- **Capture** — the view + framing.

Cleanup is always the standard teardown (`references/sandbox.md`).

## Queue with multiple PRs

- **Goal** — the merge queue view with 2–3 pull requests queued.
- **Serves** — `merge-queue/lifecycle.mdx`, `merge-queue.mdx`, setup pages.
- **Config**
  ```yaml
  queue_rules:
    - name: default
      merge_conditions: []
  ```
- **Stage** — open 3 PRs, queue each one with `sandbox.sh queue`.
- **Wait** — the queue view lists all 3 PRs.
- **Capture** — `…/queues`, frame the queue list.

## Batch of PRs

- **Goal** — several PRs grouped into one batch.
- **Serves** — `merge-queue/batches.mdx`.
- **Config**
  ```yaml
  queue_rules:
    - name: default
      batch_size: 3
      merge_conditions: []
  ```
- **Stage** — open 3 PRs, queue all three.
- **Wait** — the queue shows the 3 PRs sharing one batch.
- **Capture** — `…/queues`, frame the batch grouping.

## Priority ordering

- **Goal** — a higher-priority PR ahead of normal ones in the queue.
- **Serves** — `merge-queue/priority.mdx`.
- **Config**
  ```yaml
  queue_rules:
    - name: default
      merge_conditions: []
  priority_rules:
    - name: urgent
      conditions:
        - label = urgent
      priority: high
  ```
- **Stage** — open 3 PRs; add the `urgent` label to the last one; queue all.
- **Wait** — the urgent PR sits ahead of the earlier ones.
- **Capture** — `…/queues`, frame the ordering.

## Active freeze

- **Goal** — the dashboard showing an active queue freeze.
- **Serves** — `merge-protections/freeze.mdx`.
- **Config** — baseline queue config is enough; the freeze is created via CLI.
- **Stage** — create a freeze on the sandbox with `sandbox.sh freeze`, optionally
  with one PR queued behind it.
- **Wait** — the freeze shows as active.
- **Capture** — the freeze view.

## A queued PR's check run

- **Goal** — a pull request showing the unified "Mergify Merge Queue" check run.
- **Serves** — `merge-queue/lifecycle.mdx` (the check-run section).
- **Config** — baseline queue config.
- **Stage** — open 1 PR and queue it.
- **Wait** — the "Mergify Merge Queue" check appears on the PR.
- **Capture** — the PR's checks tab (GitHub) or the dashboard PR view, framing the
  check run.

## Paused queue

- **Goal** — the queue in a paused state.
- **Serves** — `merge-queue/pause.mdx`.
- **Config** — baseline queue config with a PR or two queued.
- **Stage** — queue 1–2 PRs, then pause the queue with the mergify CLI (or the
  `mergify:mergify-merge-queue` skill).
- **Wait** — the queue shows the paused banner/state.
- **Capture** — `…/queues`, frame the paused indicator.

---

When you build a new state not covered here, add it in this format so the next
run can reuse it.
