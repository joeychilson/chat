import {
	type BundledLanguage,
	bundledLanguages,
	createdBundledHighlighter,
	createOnigurumaEngine,
	createSingletonShorthands
} from 'shiki';

import { escapeHtml } from '$lib/utils/html';

import lightTheme from './themes/light';
import darkTheme from './themes/dark';

type BundledTheme = 'light' | 'dark';

const themes = { light: lightTheme, dark: darkTheme } as const;

export const createHighlighter = createdBundledHighlighter<BundledLanguage, BundledTheme>({
	langs: bundledLanguages,
	themes: themes,
	engine: () => createOnigurumaEngine(import('shiki/wasm'))
});

const bundledHighlighter = createSingletonShorthands(createHighlighter);

export async function highlightCode(code: string, lang: string, theme: 'light' | 'dark' = 'dark') {
	try {
		const resolvedTheme = themes[theme as keyof typeof themes];
		const resolvedLang = lang in bundledLanguages ? lang : 'plaintext';

		const html = await bundledHighlighter.codeToHtml(code, {
			lang: resolvedLang,
			theme: resolvedTheme
		});

		return html;
	} catch (error) {
		console.warn('Failed to highlight code:', { cause: error });
		return `<pre><code>${escapeHtml(code)}</code></pre>`;
	}
}
