export const getMarkdownPath = (pathname: string): string => {
  const trimmed = pathname === '/' ? '/index' : pathname.replace(/\/$/, '') || '/index';
  return `${trimmed}.md`;
};
