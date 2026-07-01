# Placement & Plumbing Guide

How to place a new docs page and wire it into the site.

## Table of contents

- [Section map](#section-map)
- [New page vs. edit existing](#new-page-vs-edit-existing)
- [Naming and paths](#naming-and-paths)
- [Navigation (navItems.tsx)](#navigation-navitemstsx)
- [Redirects (_redirects)](#redirects-_redirects)
- [SEO](#seo)

## Section map

Top-level sections under `src/content/docs/`:

| Section | Put here |
| --- | --- |
| `merge-queue/` | Queue behavior: setup, modes, rules, lifecycle, priority, batches, scopes, performance, monitoring, deploy |
| `merge-protections/` | Branch protection, auto-merge, builtin/custom protections, freezes |
| `workflow/` | Rule syntax + the `actions/` family (assign, backport, comment, label, merge, queue, rebase, review, …) |
| `configuration/` | Config reference: file-format, conditions, data-types, sharing |
| `commands/` | GitHub comment commands (queue, dequeue, rebase, squash, backport, copy, update, refresh) |
| `ci-insights/` | CI analytics setup (GitHub Actions, Buildkite, Jenkins) |
| `test-insights/` | Test framework integrations (pytest, Jest, Go, Rust, RSpec, Cypress, …) |
| `monorepo-ci/` | Monorepo CI guides |
| `stacks/` | Stacked PRs: concepts, setup, workflow, adoption |
| `integrations/` | Third-party integrations (GitHub, Datadog, Slack, Dependabot, Terraform, …) |
| `api/`, `cli/` | API and CLI usage + reference |
| `enterprise/`, `migrate/`, `security/`, `billing/`, `support/`, `browser-extensions/` | As named |

Images mirror this layout under `src/content/docs/images/<section>/`.

## New page vs. edit existing

Search before creating: `grep -ri "<feature name or key>" src/content/docs/`.

Prefer **extending an existing page** when the feature is an option, sub-behavior,
or variant of something already documented. Create a **new page** only when the
feature is a distinct concept a reader would look for on its own. A thin new page
that duplicates context is worse than a new section on an existing page.

## Naming and paths

- File: `src/content/docs/<section>/<kebab-name>.mdx`
- URL path: `/<section>/<kebab-name>` (no `.mdx`, no trailing slash in links)
- Match sibling naming style exactly (look at the directory first).

## Navigation (navItems.tsx)

`src/content/navItems.tsx` is a hierarchical `NavItem[]`. Each entry:

```tsx
{ title: 'Priority', path: '/merge-queue/priority', icon: 'lucide:traffic-cone' }
```

Nested sections use `children`, and the first child is usually an `Overview`
pointing at the section root:

```tsx
{
  title: 'Scopes',
  path: '/merge-queue/scopes',
  icon: 'lucide:network',
  children: [
    { title: 'Overview', path: '/merge-queue/scopes', icon: 'lucide:lightbulb' },
    { title: 'File Patterns', path: '/merge-queue/scopes/file-patterns', icon: 'lucide:file' },
  ],
},
```

Rules:

- Add the new entry next to its logical siblings, not at the end.
- Pick an `icon` from the same namespaces siblings use: `lucide:*`, `octicon:*`,
  `simple-icons:*` (for branded tools), or `mergify:*` (product icons).
- `id` is auto-generated (uuid v5) — do not set it.
- The sidebar renders automatically from this file; no other nav edit is needed.

## Redirects (_redirects)

`public/_redirects` uses Netlify syntax, one rule per line:

```
/old/path /new/path 301
```

When to add a redirect:

- You **renamed or moved** a page (old URL must keep working).
- A path has a common alias or an old shape people link to.

Patterns in use: both bare and trailing-slash forms are listed, and `:splat` is
used to forward subtrees:

```
/conditions /configuration/conditions 301
/conditions/ /configuration/conditions 301
/conditions/* /configuration/conditions/:splat 301
```

Never delete an existing redirect target without providing a new one.

## SEO

- `title` + `description` frontmatter drive the page `<title>`, meta description,
  OpenGraph, and the auto-generated OG image (`getOgImageUrl()`).
- Write `description` for a human searching: specific, ~120–155 chars, no filler.
- Optional frontmatter: `canonicalURL` (only if the canonical differs from the
  page URL).
