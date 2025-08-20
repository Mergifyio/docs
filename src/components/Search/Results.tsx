import classNames from 'classnames';
import { useEffect, useState } from 'react';
import { BsArrowReturnLeft } from 'react-icons/bs';
import Preview from './PageDetails';
import { AlgoliaResult } from './types';
import extractResultValue from './utils';

interface PageResultProps extends AlgoliaResult {
  onHover: () => void;
  active: boolean;
}

function PageResult({ objectID, _highlightResult, onHover, active }: PageResultProps) {
  const slug = objectID.substring(0, objectID.indexOf('.mdx'));
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
      href={slug}
      id={objectID}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div
          className="result-title"
          dangerouslySetInnerHTML={{ __html: extractResultValue(_highlightResult?.title) }}
        />
        <p
          className="result-description"
          dangerouslySetInnerHTML={{ __html: extractResultValue(_highlightResult?.title) }}
          style={{
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            width: '100%',
            margin: 0,
          }}
        />
      </div>
      {active && <BsArrowReturnLeft />}
    </a>
  );
}

interface ResultsProps {
  results: AlgoliaResult[];
}

export default function Results({ results }: ResultsProps) {
  const [focusedPage, setFocusedPage] = useState<AlgoliaResult | null>(results[0] ?? null);

  const changeFocusedPage = (page: AlgoliaResult) => () => {
    setFocusedPage(page);
  };

  const handleKeysNavigation = (e: KeyboardEvent) => {
    const getCurrentFocusedIndex = (current: AlgoliaResult | null) =>
      results.findIndex((el) => el.objectID === current?.objectID);

    const scrollToFocusedPage = (page: AlgoliaResult | null) => {
      if (page) {
        const element = document.getElementById(page.objectID);
        const container = element?.parentElement;

        if (element && container) {
          const containerHeight = container.clientHeight;
          const elementTop = element.offsetTop;
          const isHiddenTop = elementTop <= container.scrollTop;
          const isVisibleAtBottom = elementTop + element.clientHeight <= containerHeight;

          if (isHiddenTop || !isVisibleAtBottom) {
            container.scrollTo({
              top: elementTop,
            });
          }
        }
      }
    };

    if (e.key === 'ArrowDown') {
      setFocusedPage((current) => {
        const currentIndex = getCurrentFocusedIndex(current);
        const newFocused = results[Math.min(currentIndex + 1, results.length - 1)];

        scrollToFocusedPage(newFocused);

        return newFocused;
      });
    } else if (e.key === 'ArrowUp') {
      setFocusedPage((current) => {
        const currentIndex = getCurrentFocusedIndex(current);
        const newFocused = results[Math.max(currentIndex - 1, 0)];

        scrollToFocusedPage(newFocused);

        return newFocused;
      });
    } else if (e.key === 'Enter') {
      const slug = focusedPage?.objectID.substring(0, focusedPage.objectID.indexOf('.mdx'));

      if (focusedPage) window.location.replace(slug ?? '');
    }
  };

  useEffect(() => {
    setFocusedPage(results[0] ?? null);
  }, [results]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeysNavigation);

    return () => window.removeEventListener('keydown', handleKeysNavigation);
  }, [results, focusedPage]);

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
        {results.map((page) => (
          <PageResult
            active={focusedPage?.objectID === page.objectID}
            onHover={changeFocusedPage(page)}
            {...page}
            key={page.objectID}
          />
        ))}
      </div>
      <hr />
      {focusedPage && <Preview key={focusedPage.objectID} {...focusedPage} />}
    </div>
  );
}
