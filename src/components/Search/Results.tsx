import { Icon } from '@iconify/react';
import classNames from 'classnames';
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

interface PageResultProps {
  entry: SearchEntry;
  query: string;
  onHover: () => void;
  onNavigate?: () => void;
  active: boolean;
}

function PageResult({ entry, query, onHover, onNavigate, active }: PageResultProps) {
  const breadcrumb = entry.breadcrumb;

  return (
    <a
      className={classNames({ 'page-result': true, active })}
      style={{
        justifyContent: 'space-between',
        display: 'flex',
        width: '100%',
        overflow: 'hidden',
        padding: '8px 16px',
        cursor: 'pointer',
      }}
      onMouseOver={onHover}
      onClick={onNavigate}
      href={entry.url}
      id={entry.id}
    >
      <div
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: 4 }}
      >
        <div
          className="result-title"
          dangerouslySetInnerHTML={{ __html: highlightTerms(entry.title, query) }}
        />
        {breadcrumb && (
          <p
            className="result-description"
            style={{
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              width: '100%',
              margin: 0,
              fontSize: '0.875rem',
              color: 'var(--theme-text-light)',
            }}
          >
            {breadcrumb}
          </p>
        )}
      </div>
      {active && <Icon icon="bi:arrow-return-left" />}
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
      <div
        style={{
          padding: '32px 16px',
          textAlign: 'center',
          color: 'var(--theme-text-light)',
          fontSize: '0.9375rem',
        }}
      >
        No results found. Try different keywords.
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
      }}
    >
      <div
        style={{
          flex: 1,
          alignItems: 'flex-start',
          height: '100%',
          overflow: 'auto',
          position: 'relative',
        }}
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
      <hr />
      {focusedEntry && <Preview entry={focusedEntry} />}
    </div>
  );
}
