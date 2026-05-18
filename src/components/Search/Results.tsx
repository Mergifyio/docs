import { Icon } from '@iconify/react';
import { useEffect, useState } from 'react';
import Preview, { prefetchSectionHtml } from './PageDetails';
import type { SearchEntry } from './types';

/**
 * Wrap occurrences of query terms in a text string with <mark> tags.
 * Returns an HTML string safe to use with dangerouslySetInnerHTML
 * (the input text is escaped first).
 */
function highlightTerms(text: string, query: string): string {
  if (!query) return escapeHtml(text);
  const terms = query
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (terms.length === 0) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const pattern = new RegExp(`(${terms.join('|')})`, 'gi');
  return escaped.replace(pattern, '<mark>$1</mark>');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Map URL prefix to a known section key. Returns empty string for paths
 * that don't match any product section; CSS then uses the default accent. */
const SECTION_KEYS = [
  'merge-queue',
  'ci-insights',
  'test-insights',
  'merge-protections',
  'stacks',
  'workflow',
] as const;

function getSectionFromUrl(url: string): string {
  const path = url.split('#')[0].replace(/^\/|\/$/g, '');
  const first = path.split('/')[0];
  return SECTION_KEYS.includes(first as (typeof SECTION_KEYS)[number]) ? first : '';
}

interface PageResultProps {
  entry: SearchEntry;
  query: string;
  onHover: () => void;
  onNavigate?: () => void;
  active: boolean;
}

function PageResult({ entry, query, onHover, onNavigate, active }: PageResultProps) {
  const section = getSectionFromUrl(entry.url);
  return (
    <a
      className={`page-result${active ? ' active' : ''}`}
      data-section={section || undefined}
      onMouseOver={onHover}
      onClick={onNavigate}
      href={entry.url}
      id={entry.id}
    >
      <div className="page-result-body">
        <div
          className="result-title"
          dangerouslySetInnerHTML={{ __html: highlightTerms(entry.title, query) }}
        />
        {entry.breadcrumb && <p className="result-description">{entry.breadcrumb}</p>}
      </div>
      {active && <Icon icon="lucide:corner-down-left" />}
    </a>
  );
}

interface ResultsProps {
  results: SearchEntry[];
  query: string;
  onNavigate?: (query: string) => void;
}

export default function Results({ results, query, onNavigate }: ResultsProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  const scrollToIndex = (index: number) => {
    const entry = results[index];
    if (entry) {
      const element = document.getElementById(entry.id);
      const container = element?.parentElement;

      if (element && container) {
        const containerHeight = container.clientHeight;
        const elementTop = element.offsetTop;
        const isHiddenTop = elementTop <= container.scrollTop;
        const isVisibleAtBottom = elementTop + element.clientHeight <= containerHeight;

        if (isHiddenTop || !isVisibleAtBottom) {
          container.scrollTo({ top: elementTop });
        }
      }
    }
  };

  const handleKeysNavigation = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((current) => {
        const next = Math.min(current + 1, results.length - 1);
        scrollToIndex(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((current) => {
        const next = Math.max(current - 1, 0);
        scrollToIndex(next);
        return next;
      });
    } else if (e.key === 'Enter') {
      const focused = results[focusedIndex];
      if (focused) {
        onNavigate?.(query);
        window.location.replace(focused.url);
      }
    }
  };

  useEffect(() => {
    setFocusedIndex(0);
    setScrolled(false);
    // Prefetch preview HTML for the top results so the preview pane is instant.
    for (const entry of results.slice(0, 5)) {
      prefetchSectionHtml(entry);
    }
  }, [results]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeysNavigation);
    return () => window.removeEventListener('keydown', handleKeysNavigation);
  }, [results, focusedIndex]);

  const focusedEntry = results[focusedIndex] ?? null;

  if (results.length === 0) {
    return (
      <div className="search-state-no-results">
        <p className="search-state-title">No results for &quot;{query}&quot;</p>
        <p className="search-state-subtitle">Try simpler terms or check spelling.</p>
      </div>
    );
  }

  return (
    <div className="search-results-split" data-scrolled={scrolled ? '' : undefined}>
      <div
        className="search-results-list"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      >
        {results.map((entry, i) => (
          <PageResult
            key={entry.id}
            entry={entry}
            query={query}
            active={focusedIndex === i}
            onHover={() => setFocusedIndex(i)}
            onNavigate={() => onNavigate?.(query)}
          />
        ))}
      </div>
      <hr className="search-results-preview-divider" />
      {focusedEntry && <Preview entry={focusedEntry} />}
    </div>
  );
}
