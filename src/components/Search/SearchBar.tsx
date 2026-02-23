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
    <div style={{ padding: '8px 0' }}>
      <div
        style={{
          padding: '4px 16px',
          fontSize: '0.75rem',
          color: 'var(--theme-text-light)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Recent searches
      </div>
      {recent.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '8px 16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.9375rem',
            color: 'var(--theme-text)',
            textAlign: 'left',
          }}
        >
          <Icon icon="bi:clock-history" width="16" height="16" />
          {q}
        </button>
      ))}
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

  useEffect(() => {
    if (!open || !query || query.length < 2) {
      setResults(undefined);
      return;
    }

    // Clear stale results immediately so the old list doesn't linger
    // while the new search is in flight.
    setResults(undefined);

    let cancelled = false;

    const search = async () => {
      const pagefind = await getPagefind();
      const response = await pagefind.debouncedSearch(query);
      if (!response || cancelled) return;

      const loaded = await Promise.all(response.results.slice(0, 30).map((r) => r.data()));
      if (cancelled) return;

      // Deduplicate: keep only the best match per page
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
    };

    search();

    return () => {
      cancelled = true;
    };
  }, [query, open]);

  return results;
}

export default function SearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const searchResults = usePagefindSearch(search, open);

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

    // Also preload during page idle so the first search is instant
    // even if the user never hovered the button (e.g. keyboard-only users).
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

  // Escape: clear query first; if already empty, close the modal.
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

  return (
    <div id="search-bar">
      <Modal open={open} onClose={handleClose}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 16, paddingTop: 8 }}
        >
          <Icon icon="bi:search" width="24" height="24" />
          <input
            autoFocus
            name="search"
            ref={inputRef}
            value={search}
            onChange={handleSearchChange}
            style={{
              border: 'none',
              height: 46,
              fontSize: 'large',
              outline: 'none',
              flex: 1,
              background: 'transparent',
            }}
            placeholder="Search Mergify Docs"
          />
        </div>
        <hr style={{ margin: '8px 0' }} />
        {!search && <RecentSearches onSelect={setSearch} />}
        {searchResults && searchResults.length > 0 && (
          <div
            style={{
              padding: '2px 16px 6px',
              fontSize: '0.75rem',
              color: 'var(--theme-text-light)',
            }}
          >
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
          </div>
        )}
        {searchResults && (
          <Results results={searchResults} query={search} onNavigate={handleNavigate} />
        )}
      </Modal>
    </div>
  );
}
