import { defineEcConfig } from 'astro-expressive-code';

export default defineEcConfig({
  themes: ['github-light', 'github-dark'],
  themeCssSelector: (theme) => {
    if (theme.name === 'github-light') return ':root:not(.theme-dark)';
    if (theme.name === 'github-dark') return ':root.theme-dark';
    return `[data-theme='${theme.name}']`;
  },
  styleOverrides: {
    borderColor: 'var(--theme-border)',
    borderRadius: '0.5rem',
    borderWidth: '1px',
    codePaddingBlock: '1rem',
    codePaddingInline: '1.25rem',
    codeFontFamily: 'var(--font-mono)',
    codeFontSize: '0.85rem',
    codeLineHeight: '1.7',
    uiFontFamily: 'var(--font-body)',
    uiFontSize: '0.8rem',
    focusBorder: 'var(--theme-link)',
    frames: {
      frameBoxShadowCssValue: 'none',
      editorTabBarBorderBottomColor: 'var(--theme-divider)',
      editorActiveTabIndicatorBottomColor: 'var(--theme-link)',
      editorActiveTabIndicatorTopColor: 'transparent',
      editorTabBarBackground: 'var(--theme-bg-offset)',
      editorActiveTabBackground: 'var(--theme-bg-content)',
      terminalTitlebarBackground: 'var(--theme-bg-offset)',
      terminalTitlebarBorderBottomColor: 'var(--theme-divider)',
      terminalTitlebarForeground: 'var(--theme-text-muted)',
      terminalTitlebarDotsForeground: 'transparent',
      tooltipSuccessBackground: 'var(--theme-text)',
      tooltipSuccessForeground: 'var(--theme-bg-content)',
      inlineButtonBorder: 'var(--theme-divider)',
      inlineButtonForeground: 'var(--theme-text-muted)',
      inlineButtonBackgroundIdleOpacity: '0',
      inlineButtonBackgroundHoverOrFocusOpacity: '0.08',
    },
  },
});
