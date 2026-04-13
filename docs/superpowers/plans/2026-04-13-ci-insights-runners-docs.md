# CI Insights Runners Documentation Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a new documentation page for the CI Insights Runners feature at `/ci-insights/runners`.

**Architecture:** Single MDX page + nav entry. Matches the style/tone of existing CI Insights docs (e.g., `flaky-test-detection.mdx`). Three sections: overview, fleet configuration, monitoring.

**Tech Stack:** MDX, Astro, TypeScript

---

### Task 1: Create the Runners MDX page

**Files:**
- Create: `src/content/docs/ci-insights/runners.mdx`

- [ ] **Step 1: Create the MDX file with frontmatter and content**

Create `src/content/docs/ci-insights/runners.mdx` with the following content:

```mdx
---
title: Runners
description: Monitor your CI runner fleet's performance, cost, and reliability to detect issues before they impact your pipelines.
---

The Runners page gives you visibility into your CI runner fleet. Track
performance, spot bottlenecks, and identify degraded runners before they
slow down your pipelines.

Whether you're optimizing costs, investigating slow queue times, or
monitoring runner health, this page centralizes the metrics you need to
keep your CI infrastructure running smoothly.

:::note
  Before using the Runners page, you need to have CI Insights enabled on
  your repository. See the [CI Insights setup guides](/ci-insights) to
  get started.
:::

## Configuring Your Fleet

Before any runner data appears, you need to configure which runners to
track. Click **Configure Runner Groups** to set up your fleet.

**Runner groups** let you organize runners by their group name. You can
track one or more groups at a time. **Labels** let you optionally filter
runners further (e.g., by operating system or architecture).

Only runners matching your configuration will appear in the table. You
can edit this configuration at any time by clicking the **Edit** button
in the fleet configuration section.

:::tip
  Start with a single runner group to get familiar with the metrics,
  then expand your configuration as needed.
:::

## Monitoring Your Runners

Once configured, the runners table gives you an at-a-glance view of each
runner's performance, queue times, throughput, and health status. Use the
date range selector to focus on a specific time window.

Expanding any runner row reveals detailed metrics including duration
percentiles (median, p95, p99), queue time breakdowns, total runs, failure
rate, and cost data.

Each runner is assigned a **health status** — Healthy, Unstable, or
Degraded — that surfaces runners needing attention based on their success
rate and relative performance compared to their group.

:::tip
  High average queue times may indicate your fleet needs scaling. If a
  runner shows a Degraded status, investigate potential infrastructure
  issues. Use the "vs Group" comparison to quickly spot outliers
  underperforming relative to their peers.
:::
```

- [ ] **Step 2: Verify the page builds**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/docs/ci-insights/runners.mdx
git commit -m "docs(ci-insights): Add Runners page"
```

---

### Task 2: Add Runners to the navigation

**Files:**
- Modify: `src/content/navItems.tsx:26` (after the Quarantine entry)

- [ ] **Step 1: Add the Runners nav entry**

In `src/content/navItems.tsx`, add the Runners entry after the Quarantine line (line 26) and before the CI Setup section (line 27):

```typescript
      { title: 'Runners', path: '/ci-insights/runners', icon: 'fa6-solid:server' },
```

The full CI Insights children array should now read (showing context):

```typescript
      { title: 'Quarantine', path: '/ci-insights/quarantine', icon: 'fa-solid:radiation' },
      { title: 'Runners', path: '/ci-insights/runners', icon: 'fa6-solid:server' },
      {
        title: 'CI Setup',
```

- [ ] **Step 2: Run checks**

Run: `npm run check`
Expected: All checks pass (astro check, eslint, biome).

- [ ] **Step 3: Verify the page renders correctly**

Run: `npm start`
Open: `http://localhost:4321/ci-insights/runners`
Verify:
- Page renders with correct title and description
- Navigation sidebar shows "Runners" under CI Insights, between Quarantine and CI Setup
- Callout boxes render correctly (note and tip)
- Links to `/ci-insights` work

- [ ] **Step 4: Commit**

```bash
git add src/content/navItems.tsx
git commit -m "docs(ci-insights): Add Runners to navigation"
```
