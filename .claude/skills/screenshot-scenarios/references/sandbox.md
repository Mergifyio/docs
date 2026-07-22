# Sandbox

Scenarios are staged on a repo in the **mergify-sandbox** org, driven entirely
through the **sandbox-org** skill (mergify-internal plugin). That skill owns the
mechanics — repo lifecycle, config, PRs, queue, freeze, polling, teardown — and
confines every write to the org. This file only records how *this* skill uses it.

## Scenario repo

```
mergify-sandbox/dashboard-scenarios
```

First run, create and enable it (once):

```bash
sandbox.sh create dashboard-scenarios --private --description "Staged states for docs dashboard screenshots"
sandbox.sh enable dashboard-scenarios
```

Keep a minimal known-good baseline config as `baseline.mergify.yml` next to your
scenario files: each scenario overwrites it on `main`, and cleanup pushes it back.

## Recipe step → sandbox-org command

Set `REPO=dashboard-scenarios` (the `mergify-sandbox/` prefix is implied).

| recipe step | command |
| -- | -- |
| push the scenario config | `sandbox.sh push-config $REPO ./scenario.mergify.yml` |
| open a scenario PR (repeat N×) | `sandbox.sh open-pr $REPO scenario/pr-1` |
| queue a PR | `sandbox.sh queue $REPO <num>` |
| freeze (for freeze shots) | `sandbox.sh freeze $REPO --reason "docs freeze shot"` |
| labels / priority | `gh pr edit <num> --repo mergify-sandbox/$REPO --add-label <label>` |
| wait until settled | `sandbox.sh wait-queued $REPO <num>` |

For queue status while polling a specific state, `sandbox.sh queue-status $REPO`.

## Cleanup (always)

```bash
sandbox.sh cleanup $REPO      # close every scenario/ PR, delete its branch
sandbox.sh unfreeze $REPO     # lift any freeze the scenario created
sandbox.sh push-config $REPO ./baseline.mergify.yml   # restore the baseline config on main
```

`cleanup` only touches PRs whose branch starts with `scenario/`, so it never
removes unrelated work. Always tear down — even on failure — so the next scenario
starts from baseline.
