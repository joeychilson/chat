<script lang="ts">
	import IconCheck from '~icons/tabler/check';
	import IconCopy from '~icons/tabler/copy';
	import IconDownload from '~icons/tabler/download';
	import IconTextWrap from '~icons/tabler/text-wrap';
	import IconTextWrapDisabled from '~icons/tabler/text-wrap-disabled';

	import { Button } from '$lib/components/ui/button';
	import { useClipboard } from '$lib/hooks/use-clipboard.svelte';
	import { highlightCode } from '$lib/markdown/highlighter';
	import { mode } from 'mode-watcher';
	import { getFileExtension } from '$lib/files';
	import { escapeHtml } from '$lib/utils/html';

	const { copyText, isCopied } = useClipboard();

	interface Props {
		lang: string;
		text: string;
	}

	const { lang, text }: Props = $props();

	let isWrapped = $state(false);
	let highlightedHtml = $state('');

	const blockId = 'code-' + Math.random().toString(36).substring(2, 9);

	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	let nextAllowedTime = 0;
	const throttleMs = 16;

	let lastCode = '';
	let lastLang = '';
	let lastTheme = '';

	function scheduleHighlighting(code: string, lang: string, theme: 'light' | 'dark') {
		const now = Date.now();

		if (timeoutId !== null) {
			clearTimeout(timeoutId);
		}

		const delay = Math.max(0, nextAllowedTime - now);

		timeoutId = setTimeout(async () => {
			try {
				const html = await highlightCode(code, lang, theme);
				highlightedHtml = html;
				nextAllowedTime = Date.now() + throttleMs;
			} catch (error) {
				console.warn('Failed to highlight code:', error);
				highlightedHtml = `<pre><code>${escapeHtml(code)}</code></pre>`;
			} finally {
				timeoutId = null;
			}
		}, delay);
	}

	$effect(() => {
		const theme = mode.current === 'dark' ? 'dark' : 'light';
		const currentLang = lang || 'text';

		if (text === lastCode && currentLang === lastLang && theme === lastTheme) {
			return;
		}

		lastCode = text;
		lastLang = currentLang;
		lastTheme = theme;

		if (!text.trim()) {
			highlightedHtml = '';
			return;
		}

		scheduleHighlighting(text, currentLang, theme);
	});

	$effect(() => {
		return () => {
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
			}
		};
	});

	const downloadCode = async () => {
		const extension = getFileExtension(lang || 'plaintext');
		const filename = `${blockId}${extension}`;

		const blob = new Blob([text], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');

		anchor.href = url;
		anchor.download = filename;

		document.body.appendChild(anchor);
		anchor.click();

		document.body.removeChild(anchor);
		URL.revokeObjectURL(url);
	};
</script>

<div
	class="relative mt-4 mb-4 overflow-hidden rounded-lg border first:mt-0 last:mb-0 [&_pre]:m-0 [&_pre]:rounded-none [&_pre]:border-0 [&_pre]:px-3 [&_pre]:py-2 [&>div>pre]:m-0 [&>div>pre]:rounded-none [&>div>pre]:border-0 [&>div>pre]:px-3 [&>div>pre]:py-2"
>
	<div class="bg-muted flex items-center justify-between border-b p-1 text-sm">
		<span class="text-foreground pl-2 font-mono font-medium">{lang || 'plaintext'}</span>
		<div class="flex items-center gap-1">
			<Button
				variant="ghost"
				size="sm"
				onclick={() => (isWrapped = !isWrapped)}
				class="size-8 p-0"
				aria-label={isWrapped ? 'Disable text wrapping' : 'Enable text wrapping'}
			>
				{#if isWrapped}
					<IconTextWrapDisabled
						class="text-muted-foreground hover:text-foreground size-4 transition-colors"
					/>
				{:else}
					<IconTextWrap
						class="text-muted-foreground hover:text-foreground size-4 transition-colors"
					/>
				{/if}
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onclick={downloadCode}
				class="size-8 p-0"
				aria-label="Download code block"
			>
				<IconDownload
					class="text-muted-foreground hover:text-foreground size-4 transition-colors"
				/>
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onclick={() => copyText(blockId, text)}
				class="size-8 p-0"
				aria-label={isCopied(blockId) ? 'Code copied' : 'Copy code to clipboard'}
			>
				{#if isCopied(blockId)}
					<IconCheck class="size-4 text-green-500" />
				{:else}
					<IconCopy class="text-muted-foreground hover:text-foreground size-4 transition-colors" />
				{/if}
			</Button>
		</div>
	</div>

	<div
		class={isWrapped
			? 'break-words whitespace-pre-wrap [&>pre]:break-words [&>pre]:whitespace-pre-wrap'
			: ''}
	>
		{#if highlightedHtml}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html highlightedHtml}
		{:else}
			<pre><code>{text}</code></pre>
		{/if}
	</div>
</div>
