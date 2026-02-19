import { useEffect, useState } from 'react';
import type { SearchEntry } from './types';

interface PreviewProps {
  entry: SearchEntry;
}

const htmlCache = new Map<string, string>();

export function clearHtmlCache() {
  htmlCache.clear();
}

/**
 * Fetch the page HTML and extract the section content between the target
 * heading anchor and the next same-or-higher-level heading.
 * Falls back to the Pagefind excerpt when the fetch fails or there is no anchor.
 */
async function fetchSectionHtml(entry: SearchEntry): Promise<string> {
  const cached = htmlCache.get(entry.url);
  if (cached) return cached;

  try {
    // pageUrl is the base page (no fragment); entry.url may include #anchor
    const pageUrl = entry.pageUrl;
    const anchor = entry.url.includes('#') ? entry.url.split('#')[1] : null;

    const res = await fetch(pageUrl);
    if (!res.ok) return entry.excerpt;

    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    // If no anchor, return the intro content (everything before first heading
    // inside #main-content)
    const main = doc.getElementById('main-content');
    if (!main) return entry.excerpt;

    if (!anchor) {
      // Collect content before first h2/h3 inside main article
      const article = main.querySelector('article') ?? main;
      const parts: string[] = [];
      for (const child of Array.from(article.children)) {
        if (child.matches('h1, h2, h3, h4, .heading-wrapper')) break;
        if (child.matches('p, ul, ol, pre, blockquote, div, section, table')) {
          parts.push(child.outerHTML);
        }
      }
      const html = parts.join('') || entry.excerpt;
      htmlCache.set(entry.url, html);
      return html;
    }

    // Find the heading element by its id
    const heading = doc.getElementById(anchor);
    if (!heading) return entry.excerpt;

    // Walk up to the heading-wrapper if present
    const startEl = heading.parentElement?.classList.contains('heading-wrapper')
      ? heading.parentElement
      : heading;

    // Determine the heading level to know when to stop
    const tag = heading.tagName.toLowerCase();
    const level = Number.parseInt(tag.replace('h', ''), 10) || 2;

    // Build a selector for headings of same or higher level
    const stopTags = Array.from({ length: level }, (_, i) => `h${i + 1}`).join(', ');

    // Collect sibling elements until the next same-or-higher heading
    const parts: string[] = [startEl.outerHTML];
    let sibling = startEl.nextElementSibling;
    while (sibling) {
      if (sibling.matches(stopTags)) break;
      if (sibling.classList.contains('heading-wrapper')) {
        const inner = sibling.querySelector(stopTags);
        if (inner) break;
      }
      parts.push(sibling.outerHTML);
      sibling = sibling.nextElementSibling;
    }

    const html = parts.join('');
    htmlCache.set(entry.url, html);
    return html;
  } catch {
    return entry.excerpt;
  }
}

export default function Preview({ entry }: PreviewProps) {
  const [html, setHtml] = useState(entry.excerpt);

  useEffect(() => {
    let cancelled = false;
    setHtml(entry.excerpt);

    fetchSectionHtml(entry).then((result) => {
      if (!cancelled) setHtml(result);
    });

    return () => {
      cancelled = true;
    };
  }, [entry.url]);

  return (
    <div
      style={{
        display: 'flex',
        padding: 16,
        justifyContent: 'flex-start',
        alignItems: 'start',
        flex: 2,
        height: '100%',
        overflow: 'auto',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {html && (
        <div
          className="search-preview-html"
          style={{
            margin: '8px 0',
            lineHeight: 1.6,
            width: '100%',
            overflow: 'hidden',
            overflowY: 'auto',
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}

      <a
        href={entry.url}
        style={{
          marginTop: 8,
          fontSize: '0.875rem',
          color: 'var(--theme-accent)',
        }}
      >
        View full {entry.url.includes('#') ? 'section' : 'page'} →
      </a>
    </div>
  );
}
