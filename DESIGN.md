# Docs Design System

This file documents **design intent and conventions** for `docs.mergify.com` — the "why" behind
decisions, not the values themselves. For exact values (colors, spacing, typography), read the
source files listed below; the code is the source of truth.

> Companion file to `CLAUDE.md`: `CLAUDE.md` covers project setup, commands, and codebase rules.
> `DESIGN.md` is the design system this site is built from. Keep them aligned: when a design rule
> changes here, update the matching section in `CLAUDE.md` (or vice-versa) so they don't drift.

## Source Files

| What | Where |
| --- | --- |
| Primitive tokens (gray scale + product palette) | [`src/styles/tokens.css`](./src/styles/tokens.css) |
| Semantic tokens + dark-mode remaps | [`src/styles/theme.css`](./src/styles/theme.css) |
| Typography utility classes | [`src/styles/typography.css`](./src/styles/typography.css) |
| Global content rules + section-accent system | [`src/styles/index.css`](./src/styles/index.css) |
| Product accent colors (canonical source) | [`mergify.com/DESIGN.md`](../mergify.com/DESIGN.md) — "Product Accent Colors" section |
| Reusable Astro components | [`src/components/`](./src/components/) |
| Page layout templates | [`src/layouts/`](./src/layouts/) |
| Icons (Phosphor bold + custom SVGs) | Inline `?raw` imports; no icon component abstraction yet |
| Agent instructions | [`AGENTS.md`](./AGENTS.md) — "Design System" section |
| Claude instructions | [`CLAUDE.md`](./CLAUDE.md) — "Design System" section |

## Visual Theme

`docs.mergify.com` is a reference site for developers who are already using or evaluating Mergify.
They arrive from search, GitHub links, and product UI. The goal is to answer their question quickly
and get out of the way. It is **not** a conversion funnel — that is `mergify.com`'s job.

Built with Astro 5 + MDX + plain CSS. No Tailwind (the site predates the Tailwind migration on the
marketing site; adding it is out of scope). Dark mode is supported via the `:root.theme-dark`
class-based mechanism.

**Key characteristics:**

- Neutral foundation — primary text and buttons are `gray-900` / `gray-50` (black/white), not
  `--color-mergify-blue`. Product palette colors appear only when a surface is *about* that product.
- Clean gray ramp — intentionally diverges from `mergify.com`'s gray scale, which has
  `gray-50 == gray-200` collisions. The docs ramp has no duplicates; `gray-50` through `gray-900`
  are distinct values you can reach for without reading a gotchas table.
- Light + dark — the marketing site is light-only; docs ships both modes because developers working
  in dark terminals expect it.
- Inter variable font, same as the marketing site. Self-hosted via `@fontsource/inter`.
- Compact layout — content shares horizontal space with a left sidebar and right ToC. The hero
  typography cap is smaller than marketing's (`clamp(2.5rem, 4.5vw, 3rem)` vs. 64px) because the
  reading column is narrower.

## Color Tokens

All colors live in three layers. **Components consume only the semantic layer.**

### Layer 1 — Primitive (`tokens.css`)

Fixed hex values. Never changes between light and dark mode.

```css
/* Neutrals */
--color-white, --color-dark
--color-gray-50 … --color-gray-900

/* Product palette — verbatim from mergify.com */
--color-teal-400, --color-teal-700
--color-purple-400, --color-purple-700
/* …etc for orange, blue, coral, rose… */
--color-blue-800  /* docs-only: link hover */
```

Where primitive tokens are allowed:

1. Inside `tokens.css` itself (where they are defined).
2. Inside `theme.css` (where they are mapped to semantic names).
3. **Product-specific UI** that intentionally carries a product's brand color — the
   `<Aside>` callout types (note → blue, tip → teal, caution → orange, danger → coral),
   `Button.astro`'s `blue` colorScheme, `AcademyCallout` (Merge Queue teal), and the
   per-product pills in the changelog. Treat this as a narrow exception: prefer a
   semantic alias unless the surface is *literally a product accent* and a semantic
   name would only restate the product palette.

Outside of those cases, do not reference `--color-*` directly.

### Layer 2 — Semantic (`theme.css`)

Mode-aware names that components and content rules consume. Defined once for light, remapped once
in `:root.theme-dark`. These are the default tokens components should touch; direct `--color-*`
usage is reserved for the narrow product-accent exception above.

```css
--theme-text            /* primary text */
--theme-text-secondary  /* supporting text */
--theme-text-muted      /* de-emphasized text, captions */
--theme-bg              /* page background */
--theme-bg-content      /* card / content surface */
--theme-bg-offset       /* raised surface (inline code bg, sidebar) */
--theme-border          /* borders, dividers */
--theme-link            /* link color */
--theme-link-hover      /* link hover */
--theme-accent          /* primary action / heading emphasis */
```

### Layer 3 — Section accents (`index.css`)

A `--section-accent` custom property set on `<body>` by class. Each documentation section gets
its own accent color; the ToC active-link and sidebar hover states consume it automatically. One
rule block, not one block per section.

```css
body { --section-accent: var(--theme-link); }
body.section-merge-queue { --section-accent: var(--color-teal-700); }
/* …etc… */
```

### The discipline rule

**Components never reference primitive tokens directly.** If you find yourself writing
`var(--color-gray-300)` inside a component, stop and use `var(--theme-border)` instead. The
primitive layer exists so `theme.css` has legible, self-documenting mappings — not so consumers
can bypass the semantic layer.

## Product Accent Colors

Product colors are verbatim from `mergify.com/DESIGN.md`. The docs site reuses the same palette
without adding new tokens.

| Product | Dark / Label | Light / Accent | Hex (label) |
| --- | --- | --- | --- |
| Merge Queue | `--color-teal-700` | `--color-teal-400` | #1CB893 |
| CI Insights | `--color-purple-700` | `--color-purple-400` | #4D59E0 |
| Test Insights | `--color-orange-700` | `--color-orange-400` | #F27B2A |
| Merge Protections | `--color-blue-700` | `--color-blue-400` | #43A7E5 |
| Stacks | `--color-coral-700` | `--color-coral-400` | #E53935 |
| Workflow Automation | `--color-rose-700` | `--color-rose-400` | #E61E71 |

One docs-only addition: `--color-blue-800` (#237caf) for link hover. It is a darker shade of
`blue-700` and exists only because docs is text-heavy with many cross-references; the marketing
site uses product colors for links far less often.

### Section-accent body classes

The `<body>` element receives a class based on the active documentation section. This drives the
ToC active-link color and left-sidebar hover highlight.

| Body class | Section | Accent token |
| --- | --- | --- |
| (no class) | General / configuration | `--theme-link` (blue-700) |
| `section-merge-queue` | Merge Queue | `--color-teal-700` |
| `section-ci-insights` | CI Insights | `--color-purple-700` |
| `section-test-insights` | Test Insights | `--color-orange-700` |
| `section-merge-protections` | Merge Protections | `--color-blue-700` |
| `section-stacks` | Stacks | `--color-coral-700` |
| `section-workflow` | Workflow Automation | `--color-rose-700` |

The class is applied by the layout; do not hardcode accent colors inside section-specific
components. Consume `var(--section-accent)` and `var(--section-accent-bg)` instead.

Note on link color vs. Merge Protections accent: both use `blue-700`. On a Merge Protections page,
inline links and product pills share a hue but serve different roles (underlined inline link vs.
solid pill). The visual conflation is minor and preferable to introducing a new shade.

## Dark Mode

### Mechanism

`:root.theme-dark` is added to the `<html>` element by a `<script is:inline>` in `HeadCommon.astro`
before the first paint, based on `localStorage` or `prefers-color-scheme`. The `ThemeToggleButton`
updates both `localStorage` and the class at runtime. No JavaScript framework is involved; the
class toggle is pure DOM.

### Where remaps live

Every dark-mode remap is in one place: the `:root.theme-dark` block in `theme.css`. Nowhere else.

```
tokens.css         ← primitives (fixed, no dark remap)
theme.css          ← semantic layer
  :root            ← light semantic values
  :root.theme-dark ← dark overrides (ONLY here)
typography.css     ← utility classes (mode-agnostic)
index.css          ← global rules, section accents (no mode-conditional CSS)
```

Component-scoped styles never include `:root.theme-dark` blocks. They consume semantic tokens and
dark mode works automatically.

### Product palette does not flip

`--color-teal-700`, `--color-purple-700`, and all other product tokens stay the same value in dark
mode. Brand recognition and in-context UI legibility depend on these colors being stable; the
surrounding surface contrast changes instead.

### Adding a new token

1. Add the primitive value to `:root` in `tokens.css`.
2. Add a semantic name in the `:root` block in `theme.css`, pointing at the primitive.
3. Add a dark-mode override in the `:root.theme-dark` block in `theme.css`, also pointing at a
   primitive (or a different primitive).
4. Document the new token in this file under the appropriate section.
5. Consume the semantic token — never the primitive — in components.

## Typography

Two font families:

- **Inter variable** — everything visible to users. Loaded via `@fontsource/inter` (400, 500,
  600, 700 weights).
- **Poppins** — loaded but limited to decorative use (100, 200 weights). Prefer Inter for all
  body and heading copy.
- **System mono** — code blocks and inline code.

### Utility classes

Defined in `typography.css`. Apply by class on custom-built pages and Astro components.
MDX-rendered headings automatically get the same sizing via `#main-content h1..h6` selectors in
`index.css` — authors writing MDX do not need to add classes.

| Class | Size | Weight | Line-height | Use |
| --- | --- | --- | --- | --- |
| `heading-hero` | clamp(2.5rem, 4.5vw, 3rem) | 500 | 1.2 | Homepage / hub-page H1. Smaller cap than marketing (64px) because the content column is narrower. |
| `heading-page` | 2rem | 500 | 1.2 | Regular doc-page H1. |
| `heading-section` | 1.5rem | 500 | 1.3 | Content H2. |
| `heading-subsection` | 1.25rem | 500 | 1.3 | Content H3. |
| `heading-detail` | 1.125rem | 500 | 1.4 | Content H4. |
| `heading-minor` | 1rem | 500 | 1.4 | H5 / H6. |
| `text-subtitle` | 1.125rem | 400 | 1.5 | Page description / lead paragraph. |
| `text-eyebrow` | 0.75rem uppercase | 600 | — | Small label above section headings. Rarely used in prose docs; reserved for hub-page heroes (B-pass). |

Letter-spacing: `-0.025em` on `heading-hero`, `heading-page`, `heading-section`. `-0.01em` on
`heading-subsection`. Not set on `heading-detail` and smaller. All headings use
`text-wrap: balance`.

### When to use `heading-hero` vs `heading-page`

`heading-hero` is for the homepage and product hub pages (`/merge-queue`, `/ci-insights`, etc.)
where the H1 is a marketing-register statement that needs visual weight. `heading-page` is for
every regular reference page — configuration options, how-to guides, API docs. When in doubt, use
`heading-page`.

### MDX content auto-styling

Authors writing MDX do not add classes. The `#main-content h2` selector in `index.css` mirrors
the `heading-section` properties; `#main-content h3` mirrors `heading-subsection`; and so on
through H6. When you change a utility's properties, update the corresponding `#main-content`
selector too — they must stay in sync.

### Eyebrow rules

`text-eyebrow` is uppercase, letter-spaced, small. Keep eyebrow labels to 2–4 words. Use the
section's accent color (`var(--section-accent)`) when the eyebrow labels a product feature;
use `var(--theme-text-muted)` for neutral sections. Eyebrows are currently used only on the
homepage and hub pages — do not add them to prose documentation pages.

## Layout & Spacing

The layout is a classic three-column docs shell: left sidebar, content column, right ToC. Key
sizing variables live in `theme.css`.

| Variable | Value | Notes |
| --- | --- | --- |
| `--max-width` | 46em | Reading column max-width. Keeps prose lines short for readability. |
| `--theme-sidebar-width` | ~18rem | Left sidebar width (see `theme.css` for exact breakpoint rules). |
| `--theme-navbar-height` | 4rem | Sticky top nav height. Used in `calc()` for scroll offsets and sticky positioning. |
| `--theme-mobile-toc-height` | varies | Height of the on-page mobile ToC bar, used in gradient calculations. |

Do not add new `max-width` values without updating this table. The 46em reading column is
intentional — narrower than the marketing site's 1200px container because docs is prose-heavy.

## Components

Before building anything custom, check `src/components/`. The components below are the primary
building blocks; reach for them before rolling your own.

| Component | Purpose |
| --- | --- |
| `Aside` | Callout boxes — `note`, `tip`, `caution`, `danger` variants. Use directive syntax in MDX: `:::note`. |
| `Button` | Anchor or button element with `primary` (solid) and `outline` variants. Consumes product palette via `colorScheme` prop. |
| `DocsetGrid` | Grid of doc-section cards, used on the homepage and hub pages. |
| `CommunityButton` | "Join Slack" / community CTA button with Discord/Slack icon. |
| `Breadcrumbs` | Page breadcrumb trail, rendered above the page title. |
| `PageContent` | Content column wrapper — handles padding, max-width, ToC anchor injection. |
| `Header` | Top navigation bar including the theme toggle and search trigger. |
| `LeftSidebar` | Navigation sidebar with collapsible section groups. |
| `RightSidebar` | On-page ToC with active-link tracking. |
| `PageFeedback` | "Was this helpful?" widget at the bottom of every doc page. |

Astro component files live in `src/components/`. Layout wrappers live in `src/layouts/`.

## Voice

The docs site serves **the searcher**, not the funnel. A developer who lands on a configuration
reference page needs an accurate, direct answer — not brand personality.

**Docs voice is informational + on-voice.** It is clear, neutral, and technically precise. It does
not use Mergify's marketing voice ("fun + arrogant"). Marketing's confident-cocky register belongs
on `mergify.com` product pages; on docs it reads as noise that buries the answer.

Concretely:

- Write for someone who arrived from a search query and needs to know what a config key does.
- Skip openers like "Great news!" or "Simply add…". Cut to the content.
- Do not editorialize ("This is the recommended way…") unless there is a genuine reason to steer
  the reader (safety, correctness, performance).
- Use second person ("you") consistently. Avoid the royal "we".
- Code samples should be minimal and runnable. Do not add features to the example that the text
  does not explain.

For marketing-register copy (homepage hero, hub-page openers), use the `mergify-internal:writing-style`
skill — it enforces the marketing voice conventions. For all prose documentation, use the
`proofread-style` skill — it enforces the docs-specific rules above and catches AI-generated
patterns (banned words: "leverage", "robust", "seamlessly", em-dashes used as filler, etc.).

**Title case** for page titles and section headings. Sentence case for body copy. Capitalize the
first part of a hyphenated compound modifier ("Auto-retry", not "Auto-Retry").

## Code Rules (STRICT)

These rules apply when writing or generating component, style, or page code.

### Use semantic tokens

- **Colors**: always `var(--theme-*)` or `var(--section-accent)` in component and content CSS.
  `var(--color-*)` primitives are only allowed inside `tokens.css` and `theme.css`.
- **Inline SVG `fill`/`stroke`**: the only place raw hex is permitted outside `tokens.css`. Use
  `currentColor` wherever possible; fall back to a `var(--color-*)` primitive only when the SVG
  must carry its own color independent of the theme.
- **Typography**: use the utility classes (`heading-section`, `text-subtitle`, etc.) on custom
  pages. Do not compose ad-hoc `font-size` / `font-weight` / `letter-spacing` combos from scratch.
- **Dark mode**: never add a `:root.theme-dark` block inside a component-scoped `<style>`. Use
  semantic tokens and let `theme.css` handle the remap automatically.

### Do not use

- **Hex literals** in any file except `tokens.css` and inline SVG `fill`/`stroke`.
- **`--chakra-colors-*`** — the Chakra color system was never the design system; all remaining
  references are migration debt to be removed.
- **`--color-mergify-blue`** — retired. Use `var(--theme-link)` for link affordances or
  `var(--theme-accent)` for primary surfaces.
- **Per-component `:root.theme-dark` rules** — all dark remaps live in `theme.css`.
- **Ad-hoc heading CSS** — no `h2 { font-size: 1.5rem; font-weight: 500; }` rules scattered
  across component files. Use the typography utilities.

### Self-correction list

If you generate any of the following, **fix it immediately**:

- Hex literal in a component or content rule (e.g., `color: #1cb893`) → find the matching
  `--color-*` primitive, then replace with the appropriate `--theme-*` semantic token.
- `var(--chakra-colors-*)` anywhere outside `theme.css` → replace with the semantic token
  (see the migration table in Phase 3 of the implementation plan).
- `var(--color-mergify-blue*)` anywhere → replace with `var(--theme-link)` or `var(--theme-accent)`.
- `:root.theme-dark { … }` inside a `<style>` block in a component → move the logic to a semantic
  token in `theme.css`.
- `font-size: 1.5rem; font-weight: 500;` heading ad-hoc combo → use `heading-section` class.

No exceptions unless the user explicitly overrides.

## Future / Open Questions

- **Phosphor icon migration.** The docs site uses a mix of Octicons and inline SVGs. The marketing
  site standardized on Phosphor bold. Migrating docs to Phosphor is a separate scope — when
  undertaken, update the "Source Files" table and the "Components" section above.
- **B-pass homepage rework.** The homepage (`src/content/docs/index.mdx`) is a documentation page
  masquerading as a landing page. B-pass will add a visual hero, one primary CTA per product,
  and remove the duplicate Reference grid. Class swaps (`content-title` → `heading-hero`, etc.)
  are landed in A-pass; the visual design work is deferred.
- **C-pass reading experience.** Several UX issues deferred from A: the top nav disappears below
  1392px (pick a smaller breakpoint or move links to an overflow menu), hub-page heroes (adopt the
  eyebrow + product-color H1 pattern from marketing's `<ProductHero>`), right-sidebar empty state
  on short pages (sticky "ask a question" CTA or hide entirely), h2 auto-numbering review (keep on
  tutorials only or remove globally).
- **Token sharing with the dashboard.** The dashboard has its own Figma-derived token set that
  diverges from both marketing and docs. Alignment across all three surfaces is a longer-term
  design-system project, not scoped to any single pass.
