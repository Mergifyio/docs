---
name: document-a-feature
description: >-
  End-to-end workflow for documenting a Mergify feature on the docs site. Use
  when asked to document a feature, write a new docs page, document a PR or
  Linear ticket, or add/update a page under src/content/docs/. Orchestrates
  placement, component selection, writing, site plumbing (navItems + redirects +
  SEO), and validation (proofread pipeline, config-example validation, build
  check). Composes with mdx-documentation, proofread-*, capture-screenshots, and
  validate-config-examples skills.
---

# Document a Feature

The spine for turning a feature into a correct, fully-wired docs page. Follow the
checklist in order. Do not skip the plumbing or validation steps — a page that is
not in `navItems.tsx` is invisible, and a page that fails `pnpm check` cannot ship.

This skill orchestrates other skills. Invoke them with the Skill tool when the
checklist points to them; do not duplicate their content here.

## Checklist

Create a todo for each step and complete them in order.

1. **Gather context** — Understand the feature.
2. **Place the page** — Decide section, new-vs-edit, and URL path.
3. **Choose components** — Map content to the right components.
4. **Write the page** — Draft MDX following conventions.
5. **Wire the plumbing** — navItems, redirects, SEO.
6. **Add visuals** — Screenshots and diagrams if needed.
7. **Validate** — Proofread pipeline, config validation, build check.

## Step 1 — Gather context

Identify the source of truth for the feature:

- **A PR**: `gh pr view <num> --json title,body,files` (use the product repo
  `Mergifyio/monorepo` for engine/dashboard changes). Read the diff to learn the
  real config keys, CLI flags, and UI surfaces — never invent them.
- **A Linear ticket**: use the Linear MCP tools if they are configured;
  otherwise read the issue from the Linear UI or have the user paste its
  acceptance criteria.
- **A description**: work from what the user gave you; ask only if a fact you
  cannot derive (exact key name, plan availability) is missing.

Establish: what the feature does, who uses it, the exact config/CLI/API surface,
and any plan/tier gating.

## Step 2 — Place the page

Read `references/placement-guide.md` for the full section map and decision rules.

Decide:

- **Which section** under `src/content/docs/` the feature belongs to.
- **New page vs. edit existing** — search for existing coverage first
  (`grep -ri "<feature>" src/content/docs/`). Extending an existing page is
  usually better than adding a thin new one.
- **The URL path** — match sibling naming (kebab-case, no `.mdx` in links).

## Step 3 — Choose components

Read `references/component-decision-table.md`. It maps each kind of content
(config reference, CLI reference, callouts, video, integration logo, CI upload
steps, interactive tables) to the right component, with import paths and props.

Prefer the schema-driven components (`OptionsTable`, `ActionOptionsTable`,
`CliCommand`) over hand-written tables — they stay in sync with the product
automatically.

## Step 4 — Write the page

Invoke the **mdx-documentation** skill for frontmatter, imports, heading
hierarchy, callouts, and the complete-page example.

While drafting, already obey the **proofread-style** rules (no em dashes, no
"let's" openers, no corporate jargon, assume the reader knows CI/Git/PRs) so the
later proofread pass is a check, not a rewrite.

Required frontmatter: `title` and `description`. The `description` doubles as the
SEO meta description and OpenGraph description — write it for a human searching,
~120–155 characters.

## Step 5 — Wire the plumbing

A page is not done until it is reachable. See `references/placement-guide.md` for
exact snippets.

1. **Navigation** — add a `NavItem` to `src/content/navItems.tsx` at the correct
   nesting level, with `title`, `path`, and an `icon` (lucide / octicon /
   simple-icons / mergify namespace — match siblings).
2. **Redirects** — if you renamed or moved a path, add a 301 line to
   `public/_redirects` (`/old/path /new/path 301`). Never break an existing URL.
3. **SEO** — confirm the `description` is present and a reasonable length.

## Step 6 — Add visuals

- **Screenshots** of the Mergify dashboard: invoke the **capture-screenshots**
  skill. It produces consistent images in the right `images/` subdir plus the
  ready-to-paste `astro:assets` import and `<Image>` tag with alt text.
- **Diagrams** (lifecycles, flows): use Graphviz `dot` code blocks — see
  mdx-documentation for the styled template.

## Step 7 — Validate

Run these before claiming the page is done:

1. **Proofread pipeline** — if total changed/added docs lines ≥ 10, spawn the 4
   proofread subagents in parallel per the repo CLAUDE.md (`proofread-style`,
   `proofread-technical`, `proofread-structure`, `proofread-consistency`) on the
   diff.
2. **Config examples** — if the page contains any YAML/`.mergify.yml` snippets,
   invoke the **validate-config-examples** skill.
3. **Build check** — run `pnpm check` (astro check + eslint + biome). Fix any
   errors. For a final SSG sanity check, `pnpm build`.

## Hard rules

- **Never** create, edit, or delete files in `src/content/changelog/` — those are
  autogenerated externally.
- **Never** hardcode image paths or use raw `![]()` markdown for images — use
  `astro:assets` `<Image>`.
- **Never** add an H1 in body content — the title becomes the H1.
- Match existing patterns over inventing new ones.
