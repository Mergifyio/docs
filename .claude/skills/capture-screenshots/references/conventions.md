# Screenshot Conventions

Consistency is the whole point. Use the same viewport, theme, and framing across
every docs screenshot so pages look coherent and re-captures diff cleanly.

## Table of contents

- [Viewport](#viewport)
- [Theme](#theme)
- [Directory & naming](#directory--naming)
- [Overlay dismissal](#overlay-dismissal)
- [Common dashboard URLs](#common-dashboard-urls)
- [Stable framing tips](#stable-framing-tips)

## Viewport

Use `resize_window` before capturing. Standard sizes:

| Purpose | Size |
| --- | --- |
| Default docs screenshot | 1440 × 900 |
| Wide / full-table view | 1680 × 1050 |
| Narrow / focused panel | 1024 × 768 |

Default to **1440 × 900** unless the content needs more width. Astro + Sharp
optimize and downscale on the site, so capture at the full standard size rather
than a cramped window — never upscale a small capture.

Capture at **2× (retina)**. The existing docs screenshots are all 2× — a 1×
capture renders visibly softer next to them. How you get 2× depends on the path:

- **Internal Playwright tool** (`Mergifyio/skills`) — sets
  `deviceScaleFactor: 2` explicitly alongside `viewport 1440×900` and writes
  `page.screenshot()` bytes straight to disk, so 2× is captured natively.
- **Interactive claude-in-chrome capture** — there is no `deviceScaleFactor`
  knob. Capture on a **2×/retina display at 100% browser zoom**; anything else
  yields a soft 1× shot. Check the PNG's pixel dimensions against its CSS region
  before wiring it in.

## Theme

Capture in **light theme by default** (the docs render on a light surface and the
existing screenshots are light). Only capture dark theme when the page is
specifically about a dark-mode feature, and then keep light and dark variants
side by side with matching framing.

## Directory & naming

Save to:

```
src/content/docs/images/<section>/<page>/<kebab-name>.png
```

- `<section>` mirrors the docs section (`merge-queue`, `integrations`,
  `ci-insights`, …).
- `<page>` is the page slug the image belongs to (omit if the section is flat and
  matches existing layout — check neighbors first).
- `<kebab-name>` describes the content: `queue-view-batched-prs.png`, not
  `screenshot-1.png`.

Match the existing layout under `src/content/docs/images/` — look before you
create a new subfolder.

## Overlay dismissal

Remove chrome that pollutes the shot. Run via `javascript_tool`. These only
remove elements from the DOM — they do NOT trigger dialogs.

```js
// Intercom launcher + messenger
document.querySelectorAll(
  '.intercom-lightweight-app, #intercom-container, [class*="intercom"]'
).forEach((el) => el.remove());

// Cookie / consent banners (adjust selector to what is present)
document.querySelectorAll(
  '[id*="cookie"], [class*="cookie-banner"], [class*="consent"]'
).forEach((el) => el.remove());
```

NEVER call `alert`, `confirm`, or `prompt` from `javascript_tool` — a modal
dialog freezes the extension and ends the session. Use `console.log` for
debugging and read it back with `read_console_messages`.

## Common dashboard URLs

`dashboard.mergify.com` (confirm against the live app; paths evolve). To target a
specific org/repo you can optionally append `?login=<org>&repository=<repo>`
(e.g. `?login=Mergifyio&repository=monorepo`); it is not required — many docs
links omit it and the dashboard resolves org/repo from the active session:

| Area | Path |
| --- | --- |
| Home | `/home` |
| Merge queues | `/merge-queue` |
| CI Insights | `/ci-insights` |
| Test Insights → Prevention | `/test-insights/prevention` |
| Test Insights → Detection | `/test-insights/detection` |
| Test Insights → Mitigation | `/test-insights/mitigation` |

`app.mergify.com` is retired and no longer resolves — always use
`dashboard.mergify.com`. If a path 404s, navigate from the dashboard UI and read
the resulting URL with `read_page` rather than guessing.

## Stable framing tips

- Wait until data has loaded (no spinners) before capturing — `read_page` to
  confirm real content is present.
- For re-captures (freshness updates), reuse the exact same viewport and URL so
  the new image lines up with the one it replaces.
- Prefer capturing a specific panel/region over the entire browser chrome; it
  keeps the reader focused and survives unrelated UI changes.
- Avoid capturing personal account names or other customers' data — use the
  user's own org or a demo org.
