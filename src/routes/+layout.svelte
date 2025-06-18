<script lang="ts">
	import '../app.css';

	import type { Snippet } from 'svelte';

	import { ModeWatcher } from 'mode-watcher';

	import { Toaster } from '$lib/components/ui/sonner';

	let { children }: { children: Snippet } = $props();
</script>

<ModeWatcher />
{@render children()}
<Toaster richColors />
