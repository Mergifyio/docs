# Astro View Transitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable SPA-like navigation on the Mergify docs site using Astro's native View Transitions, eliminating full-page reloads.

**Architecture:** Add `<ClientRouter />` to `BaseLayout.astro` to intercept navigation. Header and sidebar swap instantly (no persist — they contain URL-dependent content). Main content and TOC sidebar fade in at 150ms. Fix scripts that break under SPA navigation. **Important:** Astro's `<ClientRouter />` replaces the full `<body>` content on swap — all elements inside `<body>` get new DOM nodes, including components outside `<main>` like ImageZoom and ScrollToTop. This means closures capturing DOM refs become stale after swap.

**Tech Stack:** Astro 6 View Transitions (`astro:transitions`), no new dependencies.

**Spec:** `docs/superpowers/specs/2026-03-19-astro-view-transitions-design.md`

---

### Task 1: Enable ClientRouter in BaseLayout

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Add ClientRouter import and component**

In the frontmatter, add the import:

```astro
import { ClientRouter } from 'astro:transitions';
import { fade } from 'astro:transitions';
```

In the `<head>`, after `<title>`, add:

```astro
<ClientRouter />
```

- [ ] **Step 2: Add transition:animate directives to layout elements**

On the `<Header>` component (line 136):

```astro
<Header currentPage={currentPage} transition:animate="none" />
```

On `<aside id="left-sidebar">` (line 138):

```astro
<aside id="left-sidebar" class="sidebar" transition:animate="none">
```

On `<aside id="right-sidebar">` (line 143):

```astro
<aside id="right-sidebar" class="sidebar" transition:animate={fade({ duration: '150ms' })}>
```

On `<div id="main-content">` (line 146):

```astro
<div id="main-content" class="main-column" transition:animate={fade({ duration: '150ms' })}>
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat: enable Astro View Transitions with ClientRouter"
```

---

### Task 2: Fix sidebar scroll restoration

**Files:**
- Modify: `src/components/LeftSidebar/LeftSidebar.astro`

The current script saves sidebar scroll on `beforeunload`, which does NOT fire during SPA navigations. Change to `astro:before-swap` and also keep `beforeunload` for when the user closes/refreshes the tab.

- [ ] **Step 1: Update the scroll save script**

Replace the existing `<script is:inline>` block (lines 33-44) with:

```html
<script is:inline>
	{
		const leftSidebar = document.querySelector('.nav-groups');
		const leftSidebarScroll = localStorage.getItem('sidebar-scroll');
		if (leftSidebarScroll !== null) {
			leftSidebar.scrollTop = parseInt(leftSidebarScroll, 10);
		}
		function saveScroll() {
			localStorage.setItem('sidebar-scroll', leftSidebar.scrollTop);
		}
		window.addEventListener('beforeunload', saveScroll);
		document.addEventListener('astro:before-swap', saveScroll);
	}
</script>
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/LeftSidebar/LeftSidebar.astro
git commit -m "fix: save sidebar scroll on astro:before-swap for SPA navigation"
```

---

### Task 3: Fix ImageZoom for SPA navigation

**Files:**
- Modify: `src/components/ImageZoom.astro`

Two problems: (1) `initImageZoom()` stacks `click`/`keydown` handlers on each `astro:after-swap` call, and (2) since `<body>` content is fully replaced during swap, any closure capturing the overlay element will hold a reference to a detached DOM node after the first navigation.

Fix: register document-level handlers once with a guard, and look up DOM elements dynamically inside each handler (no closure over overlay refs).

- [ ] **Step 1: Rewrite script with dynamic DOM lookups**

Replace the `<script>` block (lines 89-137) with:

```html
<script>
  // Register document-level handlers exactly once.
  // All DOM lookups happen dynamically inside handlers to avoid stale refs
  // after View Transition swaps (which replace <body> content).
  if (!(window as any).__imageZoomInitialized__) {
    (window as any).__imageZoomInitialized__ = true;

    function getOverlay() {
      return document.getElementById('image-zoom-overlay');
    }

    function openZoom(src: string, alt: string) {
      const overlay = getOverlay();
      if (!overlay) return;
      const img = overlay.querySelector('img');
      if (img) {
        img.src = src;
        img.alt = alt;
      }
      overlay.setAttribute('data-active', '');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeZoom() {
      const overlay = getOverlay();
      if (!overlay) return;
      overlay.removeAttribute('data-active');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    // Click handler: open on article images, close on overlay/close button
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // Open zoom on article image click
      if (target.tagName === 'IMG' && target.closest('article') && !target.classList.contains('no-zoom')) {
        const img = target as HTMLImageElement;
        openZoom(img.src, img.alt);
        return;
      }

      // Close zoom on overlay or close button click
      const overlay = getOverlay();
      if (overlay?.hasAttribute('data-active')) {
        const closeBtn = overlay.querySelector('.image-zoom-close');
        if (target === overlay || target === closeBtn || closeBtn?.contains(target)) {
          closeZoom();
        }
      }
    });

    // Escape key closes zoom
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && getOverlay()?.hasAttribute('data-active')) {
        closeZoom();
      }
    });
  }
</script>
```

Key changes:
- All handlers registered once via guard — no stacking, no `astro:after-swap` needed
- All DOM lookups (`getOverlay()`, `querySelector`) happen inside handlers, not in closures — no stale refs after swap
- Merged overlay click handling into the same document click handler

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/ImageZoom.astro
git commit -m "fix: prevent ImageZoom listener stacking on SPA navigation"
```

---

### Task 4: Fix make-scrollable-code-focusable.js for SPA navigation

**Files:**
- Modify: `public/make-scrollable-code-focusable.js`

Currently runs once on initial load. After SPA navigation, new `<pre>` elements in swapped content won't have `tabindex="0"`. Add `astro:after-swap` listener.

- [ ] **Step 1: Wrap in function and add swap listener**

Replace the entire file with:

```js
function makeFocusable() {
  Array.from(document.getElementsByTagName('pre')).forEach((element) => {
    element.setAttribute('tabindex', '0');
  });
}

makeFocusable();
document.addEventListener('astro:after-swap', makeFocusable);
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add public/make-scrollable-code-focusable.js
git commit -m "fix: re-apply tabindex to pre elements after SPA navigation"
```

---

### Task 5: Fix Plausible analytics for SPA navigation

**Files:**
- Modify: `src/components/HeadCommon.astro`

Standard `plausible.js` only tracks `popstate` events. `<ClientRouter />` uses `pushState` for forward navigation, so page views won't be tracked. Add `data-spa="auto"`.

- [ ] **Step 1: Add data-spa attribute to Plausible script**

Change the Plausible script tag (lines 24-29) from:

```html
<script
	is:inline
	async=""
	defer=""
	data-domain="docs.mergify.com"
	src="https://plausible.io/js/plausible.js"></script>
```

To:

```html
<script
	is:inline
	async=""
	defer=""
	data-domain="docs.mergify.com"
	data-spa="auto"
	src="https://plausible.io/js/plausible.js"></script>
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/HeadCommon.astro
git commit -m "fix: enable Plausible SPA tracking for View Transitions"
```

---

### Task 6: Fix changelog filters for SPA navigation

**Files:**
- Modify: `src/pages/changelog/index.astro`

The changelog `<script>` captures DOM refs at module scope. On SPA navigation to the changelog from another page, the module already executed (with null refs) and won't re-run. Convert to `is:inline` and wrap in an init function.

- [ ] **Step 1: Convert script to is:inline with init function**

Replace the `<script>` block (lines 171-260) with:

```html
<script is:inline>
  function initChangelog() {
    const search = document.getElementById('search');
    const pillBar = document.getElementById('tag-pills');
    const entryRows = Array.from(document.querySelectorAll('.entry'));
    const noResults = document.getElementById('no-results');
    if (!search || !noResults || !pillBar) return;
    let activeTag = '';

    function applyFilter() {
      const q = (search.value || '').trim().toLowerCase();
      let visibleCount = 0;
      entryRows.forEach(function(el) {
        const tags = (el.getAttribute('data-tags')||'').split(',').filter(Boolean);
        const title = el.getAttribute('data-title') || '';
        const matchesTag = !activeTag || tags.includes(activeTag);
        const matchesSearch = !q || title.includes(q);
        const show = matchesTag && matchesSearch;
        el.style.display = show ? '' : 'none';
        if (show) visibleCount++;
      });
      noResults.hidden = visibleCount !== 0;
      var monthGroups = Array.from(document.querySelectorAll('.month-group'));
      monthGroups.forEach(function(group) {
        var entriesInGroup = Array.from(group.querySelectorAll('.entry'));
        var anyVisible = entriesInGroup.some(function(e) { return e.style.display !== 'none'; });
        if (activeTag) {
          group.style.display = anyVisible ? '' : 'none';
        } else {
          group.style.display = '';
        }
      });
      var yearSections = Array.from(document.querySelectorAll('section.year'));
      yearSections.forEach(function(year) {
        var months = Array.from(year.querySelectorAll('.month-group'));
        var anyMonthVisible = months.some(function(m) { return m.style.display !== 'none'; });
        if (activeTag) {
          year.style.display = anyMonthVisible ? '' : 'none';
        } else {
          year.style.display = '';
        }
      });
    }

    pillBar.addEventListener('click', function(e) {
      if (!e.target) return;
      var btn = e.target.closest('button[data-tag]');
      if (!btn) return;
      activeTag = btn.dataset.tag || '';
      pillBar.querySelectorAll('button[data-tag]').forEach(function(b) {
        var on = (b === btn);
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      applyFilter();
    });

    search.addEventListener('input', applyFilter);

    // Copy Slack command functionality
    var copyBtn = document.getElementById('copy-slack-command');
    var commandText = document.getElementById('slack-command-text');

    if (copyBtn && commandText) {
      copyBtn.addEventListener('click', function() {
        var text = commandText.textContent || '';
        navigator.clipboard.writeText(text).then(function() {
          var copyTextSpan = copyBtn.querySelector('.copy-text');
          if (copyTextSpan) {
            var originalText = copyTextSpan.textContent;
            copyTextSpan.textContent = 'Copied!';
            copyBtn.classList.add('copied');
            setTimeout(function() {
              copyTextSpan.textContent = originalText;
              copyBtn.classList.remove('copied');
            }, 2000);
          }
        }).catch(function(err) {
          console.error('Failed to copy:', err);
        });
      });
    }
  }

  initChangelog();
  document.addEventListener('astro:after-swap', initChangelog);
</script>
```

Key changes:
- Added `is:inline` so the script tag is preserved in HTML and re-evaluated
- Wrapped everything in `initChangelog()` function
- Called on initial load and on `astro:after-swap`
- Removed TypeScript type assertions (`as HTMLInputElement`, etc.) since `is:inline` scripts are not processed by Astro's bundler
- Used `function` syntax instead of arrow functions for broader compatibility in inline scripts

Note: Since `is:inline` re-runs on every swap, `initChangelog()` will add new event listeners on each visit to the changelog. The guard at the top (`if (!search || !noResults || !pillBar) return;`) prevents initialization on non-changelog pages (those elements don't exist). For repeated visits to the changelog, listeners stack — but since each call captures fresh DOM refs, and the old refs are for detached elements (harmless no-ops), this is acceptable. If it becomes a concern, add a `__changelogInitialized__` guard that resets on `astro:before-swap`.

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/pages/changelog/index.astro
git commit -m "fix: re-initialize changelog filters on SPA navigation"
```

---

### Task 7: Verify and build

- [ ] **Step 1: Run full check suite**

Run: `npm run check`
Expected: No errors from astro check, eslint, or biome.

- [ ] **Step 2: Run full build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Run tests**

Run: `npm run test`
Expected: All tests pass.

- [ ] **Step 4: Start dev server and manually verify**

Run: `npm start`

Manual verification checklist:
1. Navigate between two docs pages — content fades, header/sidebar swap instantly
2. Check sidebar active link (`aria-current="page"`) updates correctly after navigation
3. Scroll sidebar down, navigate, verify scroll position preserved
4. Navigate between enterprise and non-enterprise sections — header links update
5. Check theme toggle state preserved across navigations
6. Click an image to zoom, navigate, click another image — verify zoom works
7. Scroll down, navigate — verify ScrollToTop button works
8. Tab to a `<pre>` code block, navigate, tab to another — verify keyboard focus works
9. Navigate to changelog — verify search and tag filters work
10. Use browser back/forward buttons — verify correct content and sidebar state
11. Open mobile sidebar (narrow viewport), click a link — sidebar should close
12. Enable `prefers-reduced-motion: reduce` in OS/browser — transitions should be instant
13. Test in Firefox or Safari — should use Astro's fallback (no native View Transitions API)
14. Check Plausible analytics network requests fire on SPA navigations (DevTools Network tab)

- [ ] **Step 5: Final commit if any fixes needed, then done**
