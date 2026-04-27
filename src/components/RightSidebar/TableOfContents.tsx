import type { SyntheticEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { TocItem } from '../../util/generateToc';
import { unescape } from '../../util/html-entities';
import './TableOfContents.css';

interface Props {
  toc: TocItem[];
  labels: {
    onThisPage: string;
  };
  isMobile?: boolean;
}

const ChevronIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width="14"
    height="14"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M3.22 5.97a.75.75 0 011.06 0L8 9.69l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L3.22 7.03a.75.75 0 010-1.06z"
    />
  </svg>
);

const TableOfContentsItem = ({
  heading,
  currentSlug,
  onLinkClick,
}: {
  heading: TocItem;
  currentSlug: string;
  onLinkClick: (e: SyntheticEvent<HTMLAnchorElement>) => void;
}) => {
  const { depth, slug, text, children } = heading;
  return (
    <li>
      <a
        className={`header-link depth-${depth} ${
          currentSlug === slug ? 'current-header-link' : ''
        }`.trim()}
        href={`#${slug}`}
        onClick={onLinkClick}
      >
        {unescape(text)}
      </a>
      {children.length > 0 ? (
        <ul>
          {children.map((child) => (
            <TableOfContentsItem
              key={child.slug}
              heading={child}
              currentSlug={currentSlug}
              onLinkClick={onLinkClick}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
};

const TableOfContents = ({ toc = [], labels, isMobile }: Props) => {
  const [currentHeading, setCurrentHeading] = useState({
    slug: toc[0].slug,
    text: toc[0].text,
  });
  const [open, setOpen] = useState(!isMobile);
  const onThisPageID = 'on-this-page-heading';
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const setCurrent: IntersectionObserverCallback = (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const { id } = entry.target;
          if (id === onThisPageID) continue;
          setCurrentHeading({
            slug: entry.target.id,
            text: entry.target.textContent || '',
          });
          break;
        }
      }
    };

    const observerOptions: IntersectionObserverInit = {
      // Negative top margin accounts for `scroll-margin`.
      // Negative bottom margin means heading needs to be towards top of viewport to trigger intersection.
      rootMargin: '-100px 0% -66%',
      threshold: 1,
    };

    const headingsObserver = new IntersectionObserver(setCurrent, observerOptions);

    document
      .querySelectorAll('article :is(h1,h2,h3):not([data-toc-ignore])')
      .forEach((h) => headingsObserver.observe(h));

    return () => headingsObserver.disconnect();
  }, []);

  // Close the mobile dropdown when clicking outside or pressing Escape.
  useEffect(() => {
    if (!isMobile || !open) return;
    const handlePointer = (event: MouseEvent) => {
      const root = containerRef.current;
      if (root && !root.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isMobile, open]);

  const onLinkClick = (e: SyntheticEvent<HTMLAnchorElement>) => {
    if (!isMobile) return;
    setOpen(false);
    setCurrentHeading({
      slug: e.currentTarget.getAttribute('href')?.replace('#', '') ?? '',
      text: e.currentTarget.textContent || '',
    });
  };

  const list = (
    <ul className="toc-root">
      {toc.map((item) => (
        <TableOfContentsItem
          key={item.slug}
          heading={item}
          currentSlug={currentHeading.slug}
          onLinkClick={onLinkClick}
        />
      ))}
    </ul>
  );

  if (!isMobile) {
    return (
      <>
        <h2 className="heading" id={onThisPageID}>
          {labels.onThisPage}
        </h2>
        {list}
      </>
    );
  }

  const onTriggerClick = () => {
    setOpen((prev) => !prev);
  };

  return (
    <div className="toc-mobile-container" data-open={open || undefined} ref={containerRef}>
      <button
        type="button"
        className="docs-toolbar-button docs-toolbar-button--compact toc-toggle"
        aria-expanded={open}
        aria-controls="toc-mobile-list"
        onClick={onTriggerClick}
      >
        <span className="toc-toggle__label">{labels.onThisPage}</span>
        <ChevronIcon />
      </button>
      {open && (
        <div id="toc-mobile-list" className="toc-mobile-panel">
          {list}
        </div>
      )}
    </div>
  );
};

export default TableOfContents;
