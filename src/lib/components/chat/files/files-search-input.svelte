<script lang="ts">
	import { Input } from '$lib/components/ui/input';

	import IconSearch from '~icons/tabler/search';
	import IconLoader from '~icons/tabler/loader-2';

	interface Props {
		searchQuery?: string;
		isSearching?: boolean;
		disabled?: boolean;
		onSearch?: (query: string) => void;
	}

	let {
		searchQuery = $bindable(''),
		isSearching = false,
		disabled = false,
		onSearch
	}: Props = $props();

	let debounceTimeout: ReturnType<typeof setTimeout>;

	function handleInput() {
		if (!onSearch) return;

		clearTimeout(debounceTimeout);

		const trimmedQuery = searchQuery.trim();

		if (trimmedQuery === '') {
			onSearch('');
			return;
		}

		debounceTimeout = setTimeout(() => {
			onSearch(trimmedQuery);
		}, 300);
	}
</script>

<div class="relative">
	<IconSearch class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />

	{#if isSearching}
		<IconLoader
			class="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin"
		/>
	{/if}

	<Input
		type="text"
		placeholder="Search files..."
		{disabled}
		class="bg-muted/30 focus-visible:ring-ring h-9 border-0 pl-9 text-sm shadow-none focus-visible:ring-1 {isSearching
			? 'pr-9'
			: ''}"
		bind:value={searchQuery}
		oninput={handleInput}
		aria-label="Search files"
		autocomplete="off"
		spellcheck="false"
	/>
</div>
