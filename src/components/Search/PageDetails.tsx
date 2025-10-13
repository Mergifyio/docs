import { AlgoliaResult } from './types';

export default function Preview({ url, type, html }: AlgoliaResult) {
  const pageUrl = url.startsWith('/') ? url : url.startsWith('#') ? url : `/${url}`;

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
      {/* HTML Preview */}
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
          dangerouslySetInnerHTML={{
            __html: html,
          }}
        />
      )}

      {/* Link to full page */}
      <a
        href={pageUrl}
        style={{
          marginTop: 8,
          fontSize: '0.875rem',
          color: 'var(--theme-accent)',
        }}
      >
        View full {type === 'page' ? 'page' : 'section'} →
      </a>
    </div>
  );
}
