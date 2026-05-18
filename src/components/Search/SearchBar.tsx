import { Icon } from '@iconify/react';
import '~/util/icons';
import React, { useEffect, useRef, useState } from 'react';
import Modal from '../Modal/Modal';
import { clearHtmlCache } from './PageDetails';
import Results from './Results';
import type { PagefindInstance, SearchEntry } from './types';
import './Search.scss';

const ACRONYMS = new Set(['api', 'ci', 'ui', 'url', 'html', 'css', 'js']);
const RECENT_SEARCHES_KEY = 'pagefind-recent-searches';
const MAX_RECENT = 5;

function formatSlugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => {
      const lower = word.toLowerCase();
      return ACRONYMS.has(lower)
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function buildBreadcrumb(url: string, headingPath?: string): string {
  const path = url.split('#')[0].replace(/^\/|\/$/g, '');
  const urlParts = path ? path.split('/').filter(Boolean).map(formatSlugToTitle) : [];
  const headingParts = headingPath ? headingPath.split(' > ') : [];
  // Drop the last heading part — it's the section title shown as the result title
  if (headingParts.length > 0) headingParts.pop();
  return [...urlParts, ...headingParts].join(' › ');
}

function loadRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return;
  const recent = loadRecentSearches().filter((q) => q !== trimmed);
  recent.unshift(trimmed);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

function RecentSearches({ onSelect }: { onSelect: (q: string) => void }) {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(loadRecentSearches());
  }, []);

  if (recent.length === 0) return null;

  return (
    <div>
      <div className="search-eyebrow">Recent searches</div>
      <ul className="recent-list">
        {recent.map((q) => (
          <li key={q}>
            <button type="button" className="recent-item" onClick={() => onSelect(q)}>
              <Icon icon="lucide:history" width="16" height="16" />
              {q}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="search-state-empty">
      <div className="search-state-icon" aria-hidden="true">
        <Icon icon="lucide:search" width="28" height="28" />
      </div>
      <p className="search-state-title">Search the docs</p>
      <p className="search-state-subtitle">
        Try a config key, a feature name, or &quot;merge queue&quot;.
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="search-skeleton" aria-hidden="true">
      <div className="search-skeleton-row" />
      <div className="search-skeleton-row" />
      <div className="search-skeleton-row" />
    </div>
  );
}

function KbdHints() {
  return (
    <div className="search-footer">
      <span className="search-footer-hint">
        <kbd className="search-footer-kbd">↑</kbd>
        <kbd className="search-footer-kbd">↓</kbd>
        navigate
      </span>
      <span className="search-footer-hint">
        <kbd className="search-footer-kbd">↵</kbd>
        open
      </span>
      <span className="search-footer-hint">
        <kbd className="search-footer-kbd">esc</kbd>
        close
      </span>
    </div>
  );
}

let pagefindInstance: PagefindInstance | null = null;

async function getPagefind(): Promise<PagefindInstance> {
  if (pagefindInstance) return pagefindInstance;
  const path = '/pagefind/pagefind.js';
  const pf: PagefindInstance = await import(/* @vite-ignore */ path);
  await pf.init();
  pagefindInstance = pf;
  return pf;
}

/** Warm up the Pagefind index in the background without blocking. */
function preloadPagefind() {
  getPagefind().catch(() => {});
}

function usePagefindSearch(query: string, open: boolean) {
  const [results, setResults] = useState<SearchEntry[]>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !query || query.length < 2) {
      setResults(undefined);
      setLoading(false);
      return;
    }

    setResults(undefined);
    setLoading(true);

    let cancelled = false;

    const search = async () => {
      const pagefind = await getPagefind();
      const response = await pagefind.debouncedSearch(query);
      if (!response || cancelled) return;

      const loaded = await Promise.all(response.results.slice(0, 30).map((r) => r.data()));
      if (cancelled) return;

      const seen = new Set<string>();
      const entries: SearchEntry[] = [];
      for (const page of loaded) {
        const pageUrl = page.url.split('#')[0];
        if (seen.has(pageUrl)) continue;
        seen.add(pageUrl);
        entries.push({
          id: page.id,
          url: page.url,
          title: page.meta.title,
          excerpt: page.excerpt,
          pageTitle: page.meta.pageTitle || page.meta.title,
          pageUrl,
          breadcrumb: buildBreadcrumb(page.url, page.meta.headingPath),
        });
      }

      setResults(entries);
      setLoading(false);
    };

    search();

    // React runs this cleanup before the next effect body fires, so any
    // in-flight search sees cancelled=true and won't call setLoading(false)
    // after the new query's setLoading(true) has already fired. Order is
    // load-bearing — don't reorder the cleanup and the body's setLoading.
    return () => {
      cancelled = true;
    };
  }, [query, open]);

  return { results, loading };
}

export default function SearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { results: searchResults, loading } = usePagefindSearch(search, open);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleClose = () => {
    setOpen(false);
    setSearch('');
    clearHtmlCache();
  };

  const handleNavigate = (query: string) => {
    saveRecentSearch(query);
  };

  useEffect(() => {
    const button = document.getElementById('docsearch-search-button');
    const openModal = () => {
      setOpen(true);
    };
    const openModalKeydown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        openModal();
        return;
      }
      if (e.key === '/' && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const active = document.activeElement as HTMLElement | null;
        const isTypingTarget =
          !!active &&
          (active.tagName === 'INPUT' ||
            active.tagName === 'TEXTAREA' ||
            active.isContentEditable === true);
        if (!isTypingTarget) {
          e.preventDefault();
          openModal();
        }
      }
    };

    button?.addEventListener('click', openModal);
    button?.addEventListener('mouseenter', preloadPagefind, { once: true });
    window.addEventListener('keydown', openModalKeydown);

    const idleHandle =
      typeof requestIdleCallback !== 'undefined'
        ? requestIdleCallback(() => preloadPagefind())
        : setTimeout(preloadPagefind, 3000);

    return () => {
      button?.removeEventListener('click', openModal);
      button?.removeEventListener('mouseenter', preloadPagefind);
      window.removeEventListener('keydown', openModalKeydown);
      if (typeof requestIdleCallback !== 'undefined') {
        cancelIdleCallback(idleHandle as number);
      } else {
        clearTimeout(idleHandle as ReturnType<typeof setTimeout>);
      }
    };
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      if (search) {
        setSearch('');
      } else {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEscape, { capture: true });
    return () => window.removeEventListener('keydown', handleEscape, { capture: true });
  }, [open, search]);

  // Track hasRecent in state so we don't hit localStorage on every render.
  // Refresh whenever the modal opens — that's the only time it can change
  // (a successful search calls saveRecentSearch while the modal is open).
  const [hasRecent, setHasRecent] = useState(false);
  useEffect(() => {
    if (open) setHasRecent(loadRecentSearches().length > 0);
  }, [open]);
  const showRecent = !search && hasRecent;
  const showEmpty = !search && !hasRecent;

  return (
    <div id="search-bar">
      <Modal open={open} onClose={handleClose}>
        <div className="search-input-row">
          <Icon icon="lucide:search" width="20" height="20" />
          <input
            autoFocus
            name="search"
            ref={inputRef}
            value={search}
            onChange={handleSearchChange}
            className="search-input"
            placeholder="Search docs…"
          />
          {search && (
            <button
              type="button"
              className="search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <Icon icon="lucide:x" width="16" height="16" />
            </button>
          )}
        </div>

        <div className="search-body">
          {showRecent && <RecentSearches onSelect={setSearch} />}
          {showEmpty && <EmptyState />}
          {loading && <LoadingSkeleton />}
          {searchResults && searchResults.length > 0 && (
            <>
              <div className="search-eyebrow">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </div>
              <Results results={searchResults} query={search} onNavigate={handleNavigate} />
            </>
          )}
          {searchResults && searchResults.length === 0 && (
            <Results results={searchResults} query={search} onNavigate={handleNavigate} />
          )}
        </div>

        <KbdHints />
      </Modal>
    </div>
  );
}
