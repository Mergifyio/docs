import { useEffect, useState } from 'preact/hooks';
import './ThemeToggleButton.css';
import { FiMoon, FiSun } from 'react-icons/fi';

interface Props {
	labels: {
		useLight: string;
		useDark: string;
	};
	isInsideHeader?: boolean;
}

const themes = ['light', 'dark'] as const;

const icons = [<FiSun key="light" />, <FiMoon key="dark" />];

const ThemeToggle = ({ labels, isInsideHeader }: Props) => {
	const [theme, setTheme] = useState<'light' | 'dark'>();

	useEffect(() => {
		setTheme(document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light');
	}, []);

	useEffect(() => {
		const root = document.documentElement;
		if (theme === 'light') {
			root.classList.remove('theme-dark');
		} else if (theme === 'dark') {
			root.classList.add('theme-dark');
		}
	}, [theme]);

	return (
		<div className={`theme-toggle ${isInsideHeader ? 'hide-toggle-on-smaller-screens' : ''}`}>
			{themes.map((t, i) => {
				const icon = icons[i];
				const checked = t === theme;
				const themeLabel = t === 'light' ? labels.useLight : labels.useDark;
				return (
					<label key={themeLabel} title={themeLabel} className={checked ? 'checked' : ''}>
						{icon}
						<input
							type="radio"
							name="theme-toggle"
							checked={checked}
							value={t}
							aria-label={themeLabel}
							onChange={() => {
								const matchesDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

								if ((matchesDarkTheme && t === 'dark') || (!matchesDarkTheme && t === 'light')) {
									localStorage.removeItem('theme');
								} else {
									localStorage.setItem('theme', t);
								}

								setTheme(t);
							}}
						/>
					</label>
				);
			})}
		</div>
	);
};

export default ThemeToggle;
