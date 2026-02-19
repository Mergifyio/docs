import { Icon } from '@iconify-icon/react';
import React, { useEffect, useRef, useState } from 'react';
import Modal from '../Modal/Modal';
import { clearHtmlCache } from './PageDetails';
import Results from './Results';
import type { PagefindInstance, SearchEntry } from './types';
import './Search.scss';

const ACRONYMS = new Set(['api', 'ci', 'ui', 'url', 'html', 'css', 'js']);

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

let pagefindInstance: PagefindInstance | null = null;

async function getPagefind(): Promise<PagefindInstance> {
  if (pagefindInstance) return pagefindInstance;
  const path = '/pagefind/pagefind.js';
  const pf: PagefindInstance = await import(/* @vite-ignore */ path);
  pagefindInstance = pf;
  return pf;
}

function usePagefindSearch(query: string, open: boolean) {
  const [results, setResults] = useState<SearchEntry[]>();

  useEffect(() => {
    if (!open || !query || query.length < 2) {
      setResults(undefined);
      return;
    }

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
    window.addEventListener('keydown', openModalKeydown);

    return () => {
      button?.removeEventListener('click', openModal);
      window.removeEventListener('keydown', openModalKeydown);
    };
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

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
        {searchResults && <Results results={searchResults} query={search} />}
      </Modal>
    </div>
  );
}
