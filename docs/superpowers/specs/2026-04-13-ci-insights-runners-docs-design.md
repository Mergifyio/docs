# CI Insights Runners Documentation Page — Design Spec

## Context

The CI Insights Runners page is a new feature in the Mergify dashboard
that lets teams monitor their CI runner fleet. No documentation exists
for it yet. This spec defines the content and structure of a new
documentation page at `src/content/docs/ci-insights/runners.mdx`.

## Decisions

| Question | Answer |
|----------|--------|
| Audience | Both new and existing users |
| Prerequisite handling | Link to existing setup guides, don't inline steps |
| CI provider scoping | CI-agnostic language (no GitHub Actions specifics) |
| Use case priority | Equal weight: cost, performance, reliability |
| Level of detail | Summarize what the page shows; don't replicate UI tooltips |
| Actionable guidance | Light tips per concept, not a troubleshooting section |

## Page Structure

### 1. Overview

A short intro (1-2 paragraphs) explaining:

- What the Runners page is: a dashboard for monitoring your CI runner
  fleet's performance, cost, and reliability.
- Why it matters: spot slow, overloaded, or degraded runners before
  they impact your CI pipelines.
- The three use cases at equal weight: cost optimization, performance
  monitoring, reliability tracking.
- Link to CI Insights setup guides as a prerequisite.

### 2. Configuring Your Fleet

A short section explaining the fleet configuration step:

- Before any data appears, users must configure which runner groups
  (and optionally labels) to track.
- Brief explanation of what runner groups and labels represent.
- Only runners matching the configuration appear in the table.
- Mention that the configuration can be edited at any time.

No step-by-step walkthrough — the UI dialog is self-explanatory.

### 3. Monitoring Your Runners

A single section summarizing the insights available, without
going column-by-column:

- The runners table provides an at-a-glance view of each runner's
  performance, queue times, throughput, and health.
- Expanding a runner reveals detailed percentile breakdowns
  (duration, queue time) and cost/activity data.
- Health status (Healthy / Unstable / Degraded) surfaces runners
  that need attention.
- Light inline tips:
  - High queue times may indicate the fleet needs scaling.
  - Degraded runners should be investigated for infrastructure issues.
  - The "vs Group" comparison helps identify outliers within a group.

## Tone and Style

- Match existing CI Insights docs (see `flaky-test-detection.mdx`
  for reference).
- Use callout directives (:::note, :::tip) for tips.
- Keep it concise — the UI already has helpers and tooltips for
  column-level detail.

## Navigation

- Add entry in `src/content/navItems.tsx` under the CI Insights
  section, after "Quarantine" and before "CI Setup".
- Page path: `/ci-insights/runners`.

## Out of Scope

- Column-by-column reference (handled by UI tooltips).
- Health status formula details (shown in UI).
- Full troubleshooting guide.
- Screenshots (can be added later).
