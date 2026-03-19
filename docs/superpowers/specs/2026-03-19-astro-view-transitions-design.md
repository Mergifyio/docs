# Astro View Transitions for Docs Navigation

**Date:** 2026-03-19
**Status:** Approved

## Problem

The Mergify docs site uses full-page reloads for every navigation. This causes jarring flashes, loss of sidebar scroll position, and a sluggish browsing feel — especially when reading through sequential pages.

## Solution

Enable Astro's native View Transitions via `<ClientRouter />` to provide SPA-like navigation with persistent UI chrome and smooth content transitions.

## Design

### 1. Core Setup

Add `<ClientRouter />` from `astro:transitions` to the `<head>` of `BaseLayout.astro`. This intercepts link clicks, fetches pages in the background, and swaps the DOM with animated transitions. Prefetching on hover is included automatically.

**File:** `src/layouts/BaseLayout.astro`

```astro
import { ClientRouter } from 'astro:transitions';
// Add inside <head>:
<ClientRouter />
```

### 2. Transition Animations (No Persistence)

**Do NOT use `transition:persist`** on the header or sidebar. Both contain URL-dependent content:
- Header conditionally shows enterprise vs. non-enterprise links based on `currentPage`
- Left sidebar renders `aria-current="page"` on the active nav link based on `currentPage`

Persisting these elements would freeze their server-rendered state, causing stale highlights and wrong navigation links.

Instead, use `transition:animate` to control how each element transitions:

- **Header:** `transition:animate="none"` — instant swap, no flicker (it's fixed-position, so crossfade is unnecessary)
- **Left sidebar:** `transition:animate="none"` — instant swap, re-renders with correct `aria-current`
- **Main content:** `transition:animate={fade({ duration: '150ms' })}` — smooth fade
- **Right sidebar (TOC):** `transition:animate={fade({ duration: '150ms' })}` — smooth fade

**Sidebar scroll restoration:** The current `LeftSidebar.astro` saves scroll position on `beforeunload`, which does NOT fire during SPA navigations. Change the event to `astro:before-swap` so scroll position is saved before each client-side navigation. The existing `localStorage`-based restore logic will handle the rest on swap.

### 3. Script Compatibility

Existing scripts that re-initialize on page load need to hook into `astro:after-swap`:

| Component | Status | Action Needed |
|-----------|--------|---------------|
| ScrollToTop | Ready | Already listens to `astro:after-swap` |
| PageFeedback | Ready | Already listens to `astro:after-swap` |
| TableOfContents (React) | Ready | Re-hydrated automatically by Astro |
| SidebarToggle (React) | Ready | React re-hydration resets `useState` to `false`, which triggers `useEffect` to remove `mobile-sidebar-toggle` body class |
| ThemeToggleButton (React) | Ready | Hydrated island, handled by Astro |
| CopyForLLMButton | Ready | Uses event delegation on `document`, survives swap |
| NavGroup (custom element) | Ready | `customElements.define` is a one-time registration; browser auto-upgrades new `<nav-group>` elements on DOM insertion |
| ImageZoom | Ready (fix needed) | Already listens to `astro:after-swap`, but has a listener stacking bug: each `initImageZoom()` call adds new `click`/`keydown` handlers without removing old ones. Add a guard or move document-level handlers outside `initImageZoom()` |
| SearchBar (React) | Verify | Uses `client:only="react"` — should re-mount after swap, verify |
| Changelog filters + Slack copy | Needs update | Non-inline `<script>` captures DOM refs at module scope (search, pillBar, entryRows, Slack copy buttons). Broken on first SPA nav TO changelog from any other page (refs are null/empty from initial execution on a non-changelog page). Convert to `is:inline` or wrap in a function called on both load and `astro:after-swap` |
| make-scrollable-code-focusable.js | Needs update | Add `astro:after-swap` listener to set `tabindex="0"` on new `<pre>` elements |
| HeadCommon theme script | Verify | `is:inline` script sets theme on `<html>` — should survive swap since `<html>` is preserved |
| HeadCommon dblclick handler | Ready | Uses event delegation on `document`, survives swap |

### 4. Accessibility

- **Reduced motion:** `<ClientRouter />` automatically respects `prefers-reduced-motion: reduce` — falls back to instant swap
- **Screen readers:** Astro announces page title changes on navigation automatically
- **Focus management:** Focus resets to `<body>` on navigation (standard behavior)
- **Keyboard accessible code blocks:** `make-scrollable-code-focusable.js` must re-run after swap to ensure new `<pre>` elements get `tabindex="0"`
- No additional ARIA attributes needed

### 5. Known Exceptions

Pages that do NOT use `BaseLayout.astro` will not have `<ClientRouter />`:
- **404 page** (`src/pages/404.astro`) — own layout, Astro falls back to full-page navigation
- **API reference** (`src/pages/api.astro`) — own layout with scalar viewer, full-page navigation

This is acceptable — navigating to these pages triggers a standard full reload. No action needed.

### 6. Analytics

The standard `plausible.js` script only listens for `popstate` events (browser back/forward), NOT `pushState` calls (which `<ClientRouter />` uses for forward navigation). This means **forward SPA navigations will likely NOT be tracked**.

**Fix:** Add `data-spa="auto"` to the Plausible script tag in `HeadCommon.astro`. This enables Plausible's built-in SPA tracking which handles both `pushState` and `popstate`. Alternatively, use `astro:after-swap` with Plausible's manual tracking API.

## Files Changed

1. `src/layouts/BaseLayout.astro` — Add `<ClientRouter />` import, `transition:animate` directives on layout elements
2. `src/components/LeftSidebar/LeftSidebar.astro` — Change `beforeunload` to `astro:before-swap` for scroll save
3. `src/components/ImageZoom.astro` — Fix listener stacking bug (add guard or deduplicate handlers)
4. `public/make-scrollable-code-focusable.js` — Add `astro:after-swap` listener
5. `src/components/HeadCommon.astro` — Add `data-spa="auto"` to Plausible script tag
6. `src/pages/changelog/index.astro` — Add `astro:after-swap` handler for filter/search re-initialization

## Testing Plan

1. Navigate between docs pages — verify smooth fade on content, instant swap on header/sidebar
2. Verify `aria-current="page"` updates correctly in sidebar after each navigation
3. Check sidebar scroll position preserved across navigations
4. Navigate between enterprise and non-enterprise sections — verify header links update
5. Check theme toggle state preserved
6. Verify ImageZoom works on page after SPA navigation
7. Verify ScrollToTop button works after navigation
8. Verify `<pre>` elements are keyboard-focusable after navigation
9. Test browser back/forward buttons — verify correct content and sidebar state
10. Open mobile sidebar, navigate — verify sidebar closes
11. Navigate to/from changelog page — verify filters work
12. Test with `prefers-reduced-motion: reduce` — should instant-swap
13. Test in Firefox/Safari (no native View Transitions API) — should use Astro's fallback
14. Verify Plausible page views are tracked on SPA navigations
15. Run `npm run build` — ensure SSG works correctly
