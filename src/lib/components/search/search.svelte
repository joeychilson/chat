<script lang="ts">
	import { goto } from '$app/navigation';
	import { debounce } from '$lib/utils/debounce';

	import IconMessage from '~icons/tabler/message';
	import IconPin from '~icons/tabler/pin-filled';
	import IconSearch from '~icons/tabler/search';
	import IconLoader from '~icons/tabler/loader-2';

	import * as Command from '$lib/components/ui/command';
	import { Badge } from '$lib/components/ui/badge';
	import { type Model, getModelName } from '$lib/models';
	import { RecentChats } from '$lib/stores/recent-chats.svelte';
	import { timeAgo } from '$lib/utils/time';

	const recentChats = RecentChats.fromContext();

	interface SearchResult {
		id: string;
		title: string;
		pinned: boolean;
		lastMessageAt: string;
		lastModelUsed?: Model;
		branchedMessageId?: string | null;
		snippet: string;
		messageCount: number;
	}

	let { open = $bindable(false) }: { open?: boolean } = $props();

	let searchValue = $state('');
	let searchResults = $state<SearchResult[]>([]);
	let isSearching = $state(false);
	let hasSearched = $state(false);

	const searchChats = debounce(async (query: string) => {
		if (query !== searchValue.trim()) {
			return;
		}

		if (!query.trim()) {
			searchResults = [];
			isSearching = false;
			hasSearched = false;
			return;
		}

		isSearching = true;
		hasSearched = false;

		try {
			const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=20`);
			if (response.ok) {
				const data = await response.json();
				if (query === searchValue.trim()) {
					searchResults = data.chats || [];
					hasSearched = true;
				}
			} else {
				if (query === searchValue.trim()) {
					searchResults = [];
					hasSearched = true;
				}
			}
		} catch {
			if (query === searchValue.trim()) {
				searchResults = [];
				hasSearched = true;
			}
		} finally {
			if (query === searchValue.trim()) {
				isSearching = false;
			}
		}
	}, 300);

	$effect(() => {
		const query = searchValue;

		if (!query.trim()) {
			searchResults = [];
			isSearching = false;
			hasSearched = false;
			return;
		}

		searchResults = [];
		isSearching = true;
		hasSearched = false;

		searchChats(query);
	});

	$effect(() => {
		if (!open) {
			searchValue = '';
			searchResults = [];
			isSearching = false;
			hasSearched = false;
		}
	});

	function handleSelect(chatId: string) {
		open = false;
		goto(`/chats/${chatId}`);
	}

	function createHighlightedText(text: string, query: string) {
		if (!query.trim()) return [text];

		const parts = text.split(new RegExp(`(${escapeRegex(query)})`, 'gi'));
		return parts;
	}

	function escapeRegex(string: string): string {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
</script>

<Command.Dialog bind:open shouldFilter={false}>
	<Command.Input
		bind:value={searchValue}
		placeholder="Search your chats..."
		aria-label="Search your chat history"
		class="h-14 text-base"
	/>
	<Command.List class="max-h-96">
		{#if isSearching}
			<Command.Empty>
				<div class="flex items-center justify-center gap-2 py-8">
					<IconLoader class="size-4 animate-spin" />
					<span class="text-muted-foreground text-sm">Searching...</span>
				</div>
			</Command.Empty>
		{:else if searchValue.trim() === ''}
			{#if recentChats.chats.length > 0}
				<Command.Group heading="Recent Chats">
					{#each recentChats.chats.slice(0, 10) as chat (chat.id)}
						<Command.Item
							value={chat.id}
							onSelect={() => handleSelect(chat.id)}
							class="data-[selected=true]:bg-accent flex cursor-pointer items-center gap-3 px-4 py-3"
						>
							<IconMessage class="text-muted-foreground size-4" />
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<span class="truncate font-medium">{chat.title}</span>
									{#if chat.pinned}
										<IconPin class="text-muted-foreground size-3 flex-shrink-0" />
									{/if}
								</div>
							</div>
							<div class="text-muted-foreground flex flex-shrink-0 items-center gap-1 text-xs">
								{timeAgo(new Date(chat.lastMessageAt))}
							</div>
						</Command.Item>
					{/each}
				</Command.Group>
			{:else}
				<Command.Empty>
					<div class="flex flex-col items-center gap-2 py-8">
						<IconSearch class="text-muted-foreground/50 size-8" />
						<span class="text-muted-foreground text-sm">No recent chats</span>
						<span class="text-muted-foreground/70 text-xs">Start typing to search your chats</span>
					</div>
				</Command.Empty>
			{/if}
		{:else if hasSearched && searchResults.length === 0}
			<Command.Empty>
				<div class="flex flex-col items-center gap-2 py-8">
					<IconSearch class="text-muted-foreground/50 size-8" />
					<span class="text-muted-foreground text-sm">No chats found for "{searchValue}"</span>
					<span class="text-muted-foreground/70 text-xs"
						>Try different keywords or check your spelling</span
					>
				</div>
			</Command.Empty>
		{/if}

		{#if !isSearching && searchResults.length > 0}
			<Command.Group heading="Search Results">
				{#each searchResults as chat (chat.id)}
					<Command.Item
						value={chat.id}
						onSelect={() => handleSelect(chat.id)}
						class="data-[selected=true]:bg-accent flex cursor-pointer flex-col items-start gap-2 px-4 py-3"
					>
						<div class="flex w-full items-center justify-between">
							<div class="flex items-center gap-2">
								<IconMessage class="text-muted-foreground size-4" />
								<span class="font-medium">
									{#each createHighlightedText(chat.title, searchValue) as part, i (i)}
										{#if i % 2 === 1}
											<mark class="bg-yellow-200 dark:bg-yellow-900/50">{part}</mark>
										{:else}
											{part}
										{/if}
									{/each}
								</span>
								{#if chat.pinned}
									<IconPin class="text-muted-foreground size-3" />
								{/if}
							</div>
							<div class="text-muted-foreground flex items-center gap-2 text-xs">
								{timeAgo(new Date(chat.lastMessageAt))}
							</div>
						</div>

						{#if chat.snippet}
							<p class="text-muted-foreground line-clamp-2 w-full text-xs">
								{#each createHighlightedText(chat.snippet, searchValue) as part, i (i)}
									{#if i % 2 === 1}
										<mark class="bg-yellow-200 dark:bg-yellow-900/50">{part}</mark>
									{:else}
										{part}
									{/if}
								{/each}
							</p>
						{/if}

						<div class="flex w-full items-center justify-between">
							<div class="flex items-center gap-2">
								{#if chat.lastModelUsed}
									<Badge variant="secondary" class="text-xs">
										{getModelName(chat.lastModelUsed.id)}
									</Badge>
								{/if}
								<span class="text-muted-foreground text-xs">
									{chat.messageCount} message{chat.messageCount === 1 ? '' : 's'}
								</span>
							</div>
						</div>
					</Command.Item>
				{/each}
			</Command.Group>
		{/if}
	</Command.List>
</Command.Dialog>
