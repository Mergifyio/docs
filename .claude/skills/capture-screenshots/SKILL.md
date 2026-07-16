---
name: capture-screenshots
description: >-
  Capture consistent Mergify dashboard screenshots for the docs site using
  Chrome browser automation, save them to the correct images/ directory, and
  emit the ready-to-paste astro:assets import and <Image> tag with alt text. Use
  when adding or refreshing a dashboard screenshot in docs, when a docs page
  needs a UI image, or when asked to screenshot dashboard.mergify.com for
  documentation. Drives the claude-in-chrome MCP tools against the user's
  existing logged-in Chrome session.
---

# Capture Dashboard Screenshots

Produce clean, consistent screenshots of the Mergify dashboard
(`dashboard.mergify.com`) and wire them into a docs page.

## Two ways to capture

**Prefer the internal Playwright tool for batch or unattended captures.** The
capture tool in the **`Mergifyio/skills`** repo runs headless Chromium at
`deviceScaleFactor: 2` and writes PNG bytes straight to disk. It owns the
session/auth handling, which is intentionally kept out of this public repo.

**Use the interactive Chrome path below when you are working alongside the user**
— exploring the dashboard, framing a one-off shot, or capturing a state that is
easier to reach by clicking than by URL. It drives the claude-in-chrome MCP
against the user's own logged-in session.

Either way, the docs-side conventions are the same: framing, directory/naming,
and the `<Image>` wiring snippet — see `references/conventions.md`.

## Prerequisite (interactive path)

The user must already be **logged into dashboard.mergify.com in Chrome**. This
skill reuses the existing browser session through the claude-in-chrome MCP tools;
it never handles credentials. If navigation lands on a login page, stop and ask
the user to log in (`! open https://dashboard.mergify.com`), then continue.

## Load the browser tools first

This skill targets the **claude-in-chrome** MCP server (a user/Claude Code-level
MCP, not declared in this repo's `.claude/mcp.json`). The tool names below are its
stable, documented interface. If you drive a different browser MCP, map each step
to that server's equivalent capability — list tabs, create a tab, navigate,
resize the window, run in-page JavaScript, read the page, capture a screenshot.

If the `mcp__claude-in-chrome__*` tools are deferred, load them in ONE ToolSearch
call before anything else:

```
ToolSearch select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__resize_window,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__javascript_tool
```

## Workflow

1. **Get tab context** — call `tabs_context_mcp` first to see current tabs. Do
   NOT reuse an old tab unless the user asks; create a fresh one with
   `tabs_create_mcp`.
2. **Set a standard window size** — `resize_window` to the standard viewport
   (see `references/conventions.md`). Consistency across screenshots matters more
   than any single size.
3. **Navigate** — `navigate` to the target dashboard URL. Wait for the page to
   finish loading (`read_page` to confirm content is present).
4. **Clean the frame** — dismiss overlays that would pollute the shot (cookie
   banner, Intercom launcher, product tours). Use the dismissal snippets in
   `references/conventions.md`. NEVER trigger a JS `alert`/`confirm`/`prompt` —
   it freezes the extension.
5. **Capture** — take the screenshot with the `computer` tool. Frame the relevant
   region; capture the specific panel rather than the whole chrome when possible.
6. **Save** — write the image to
   `src/content/docs/images/<section>/<page>/<kebab-name>.png` following the
   naming convention.
7. **Emit the snippet** — output the ready-to-paste import + `<Image>` tag with
   drafted alt text (see below). Hand it back so it can be dropped into the MDX
   page (or applied directly if this was called from document-a-feature).

## Output snippet format

```mdx
import { Image } from "astro:assets"
import <camelCaseName> from "../../images/<section>/<page>/<kebab-name>.png"

<Image src={<camelCaseName>} alt="<what the screenshot shows, specifically>" />
```

Alt text describes what the reader sees and why it matters, not "screenshot of
dashboard". Example: `alt="Merge queue view showing two pull requests batched
together"`.

## Details

Read `references/conventions.md` for: the standard viewport sizes, theme
handling (light by default), the overlay-dismissal snippets, the
`section/page/name` directory convention, common dashboard URLs, and tips for
stable, repeatable framing.

## Guardrails

- Stop and ask if: a page won't load, you hit a login wall, or a tool errors
  2–3 times. Do not loop on a failing browser action.
- Capture a couple of extra frames if recording a flow with `gif_creator`, for
  smooth playback.
- Never commit screenshots that contain another customer's private data — use the
  user's own org or a demo org.
