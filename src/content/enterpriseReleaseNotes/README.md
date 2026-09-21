# Enterprise release notes

Upgrade notes for one on-premise release, rendered by
`/enterprise/releases`. One file per release, named after the version.

## Adding a release

**Nothing to do.** A release reaches the page on its own:

1. Cutting the tag syncs `src/data/enterprise-releases.json`, which is the list of
   releases the page renders. It is written by automation, so never edit it by hand.
2. The changes the release carries are derived from the `changelog` collection: a
   release lists everything announced between the release below it and its own
   tag, with entries tagged `Deprecations` pulled out first.

So a release that needs no operator action needs no file here, and the page says
as much for every release that has none.

## Adding a file

Add one when a release asks something of whoever runs the upgrade, and the
changelog cannot say it, because the changelog is written for the hosted service,
which has no version, no environment variables and no database of its own:

- a breaking change (only ever in a `X.0.0`)
- an environment variable added, renamed or removed
- a data migration that needs an order, a wait, or a step of its own
- a new infrastructure requirement, or a raised minimum version
- a default that changed in a way that alters load or behavior
- a configuration option removed, so that a repository still using it has to be
  updated before the upgrade

A deprecation that only warns needs no file: the changelog entry covers it and
the page already groups those first.

```
---
version: '8.9.0'      # exactly as it appears in enterprise-releases.json
actionRequired: true  # optional; flags the release on the page
---

What has to happen, in the order it has to happen.
```

Set `actionRequired` when the upgrade needs a deliberate step. It is what puts a
mark next to the version in the release's heading, which is what someone scanning
several releases at once reads before anything else.

Write in the present tense about what the release does, and say what to do rather
than when it was decided. These notes are read years later by somebody moving
several versions at once.

## Checks

`src/util/enterpriseReleases.test.ts` covers the derivation, and fails if a
version here does not match a released tag, or if the release list stops being in
chronological order, which would silently empty a release's change list rather
than break the build.
