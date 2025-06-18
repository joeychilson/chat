<script lang="ts">
	import SvelteMarkdown, { type HtmlRenderers } from '@humanspeak/svelte-markdown';

	import Code from './markdown-code.svelte';

	const { source }: { source: string } = $props();

	const renderers: Partial<HtmlRenderers> = {
		code: Code
	};
</script>

<div class="prose max-w-none">
	<SvelteMarkdown {source} {renderers} />
</div>
