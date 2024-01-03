import { astroExpressiveCode, ExpressiveCodeTheme } from 'astro-expressive-code';
import path from 'path';
import { theme } from './syntax-highlighting-theme';

// Allow creation of a pre-configured Expressive Code integration that matches the Astro Docs theme
export const astroDocsExpressiveCode = () =>
	astroExpressiveCode({
		theme: new ExpressiveCodeTheme(theme),
		styleOverrides: {
			codeBackground: 'var(--theme-code-bg)',
			borderColor: 'var(--theme-code-bg)',
			scrollbarThumbColor: 'hsl(202deg 20% 90% / 0.25)',
			scrollbarThumbHoverColor: 'hsl(202deg 20% 90% / 0.5)',
			frames: {
				editorTabBarBackground: 'var(--theme-code-tabs)',
				editorActiveTabBackground: 'hsl(202deg 40% 65% / 0.15)',
				// editorActiveTabBorderBottom: 'hsl(202deg 35% 55%)',
				// editorTabBarBorderBottom: 'var(--theme-code-tabs)',

				terminalTitlebarBackground: 'var(--theme-code-tabs)',
				// terminalTitlebarBorderBottom: 'transparent',
				terminalBackground: 'var(--theme-code-bg)',
			},
		},

		getBlockLocale: ({ file }) => {
			// Path format: `src/content/docs/en/getting-started.mdx`
			// Part indices:  0     1      2   3         4
			const pathParts = path.relative(file.cwd, file.path).split(/[\\/]/);
			return pathParts[3];
		},
	});
