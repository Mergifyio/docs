# Sandbox Driver

How to drive `Mergifyio/sandbox` to stage a state, then tear it down. All writes
target **only** this repo — confirm before every mutating command.

## Table of contents

- [First-run setup](#first-run-setup)
- [Primitives](#primitives)
- [Polling for state](#polling-for-state)
- [Cleanup (always)](#cleanup-always)
- [Safety](#safety)

## First-run setup

The sandbox may be empty. Ensure once (idempotent):

1. **Mergify enabled** — the Mergify GitHub App must be installed on
   `Mergifyio/sandbox`. If the queue never reacts, this is the first thing to
   check (stop and ask the user to enable it; you cannot install the app).
2. **A base branch with content** — `main` needs at least a `README.md` so
   branches can diverge and PRs can be opened.
   ```bash
   gh api repos/Mergifyio/sandbox/contents/README.md >/dev/null 2>&1 \
     || gh api -X PUT repos/Mergifyio/sandbox/contents/README.md \
        -f message="init" -f content="$(printf 'sandbox' | base64)"
   ```
3. **Baseline config** — keep a minimal known-good `.mergify.yml` on `main` as the
   baseline that cleanup restores to.

## Primitives

Set `REPO=Mergifyio/sandbox`. The `mergify:mergify-merge-queue`,
`mergify:mergify-config`, and `mergify:mergify-merge-protections` skills (from the
mergify plugin, when it is installed) give the higher-level semantics; the raw
`gh` / `mergify` CLI calls below are the mechanics and work without the plugin.

**Push a scenario config** (Mergify reads config from the default branch):
```bash
# Validate first with the mergify CLI, then commit .mergify.yml to main
mergify config validate --config-file /tmp/scenario.mergify.yml
# commit it to main via gh api contents (PUT) or a short-lived branch + merge
```

**Open a PR** (repeat N times for multi-PR scenarios). Keep the file path
slash-free — the `/` belongs in the branch name, not the Contents API path:
```bash
BR="scenario/pr-1"; FILE="scenario-1.txt"
gh api -X PUT "repos/$REPO/contents/$FILE" -f message="scenario pr 1" \
  -f branch="$BR" -f content="$(printf 'x' | base64)"
gh pr create --repo "$REPO" --head "$BR" --base main \
  --title "Scenario PR 1" --body "screenshot scenario"
```

**Queue a PR** — either auto-queue via the pushed config, or explicitly:
```bash
gh pr comment <num> --repo "$REPO" --body "@mergifyio queue"
```

**Freeze** (for freeze shots) — `mergify freeze create …` against the sandbox
(or the `mergify:mergify-merge-protections` skill).

**Labels / priority** — `gh pr edit <num> --repo "$REPO" --add-label <label>` to
drive priority-rule scenarios.

## Polling for state

Never capture before the state has settled. Poll until the target is reached:

```bash
mergify stack list        # or the mergify:mergify-merge-queue status view
gh pr checks <num> --repo "$REPO"
```

For a queue shot, wait until the expected PRs actually appear in the queue (and,
for batches, share a batch). Give it a bounded number of tries; if it never
settles, stop and ask (usually a config or app-enablement problem).

## Cleanup (always)

Light teardown — return the sandbox to baseline, even if the run failed:

```bash
# Close only the scenario PRs this run created (scenario/ branch prefix)
for n in $(gh pr list --repo "$REPO" --state open --json number,headRefName \
  --jq '.[] | select(.headRefName | startswith("scenario/")) | .number'); do
  gh pr close "$n" --repo "$REPO" --delete-branch
done
# Lift any freeze created for the shot (mergify CLI)
# Restore .mergify.yml on main to the baseline config
```

Only close PRs / delete branches that this run created (they use the
`scenario/` branch prefix and "Scenario" titles) — don't touch unrelated ones.

## Safety

- **Repo allowlist of one:** every write must target `Mergifyio/sandbox`. Before
  any mutating `gh`/`mergify` call, confirm the repo string is exactly that.
- Use the `scenario/` branch prefix so cleanup can identify what to remove.
- If a command would target any other repo, stop — that is a bug.
