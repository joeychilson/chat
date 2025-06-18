<script lang="ts">
	import type { PageData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	import { toast } from 'svelte-sonner';

	import IconSearch from '~icons/tabler/search';
	import IconMessage from '~icons/tabler/message';
	import IconPin from '~icons/tabler/pin';
	import IconPinFilled from '~icons/tabler/pin-filled';
	import IconEdit from '~icons/tabler/edit';
	import IconTrash from '~icons/tabler/trash';
	import IconCheck from '~icons/tabler/check';
	import IconX from '~icons/tabler/x';
	import IconFilter from '~icons/tabler/filter';
	import IconSortAscending from '~icons/tabler/sort-ascending';
	import IconDots from '~icons/tabler/dots';

	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
		DropdownMenuSeparator,
		DropdownMenuLabel
	} from '$lib/components/ui/dropdown-menu';
	import { timeAgo } from '$lib/utils/time';
	import { models } from '$lib/models';
	import { RecentChats } from '$lib/stores/recent-chats.svelte';

	let { data }: { data: PageData } = $props();

	const recentChats = RecentChats.fromContext();

	let searchQuery = $state('');
	let selectedForDeletion = $state<string[]>([]);
	let editingChatId = $state<string | null>(null);
	let editingTitle = $state('');

	let sortBy = $state<
		'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'messages-asc' | 'messages-desc'
	>('newest');
	let filterBy = $state<'all' | 'pinned' | 'unpinned'>('all');
	let filterByModel = $state<string | null>(null);

	const availableModels = $derived(
		Array.from(new Set(data.chats.map((chat) => chat.lastModelUsed?.id).filter(Boolean))).map(
			(id) => {
				const modelConfig = models.find((m) => m.id === id);
				return { id, name: modelConfig?.name || id };
			}
		)
	);

	const filteredAndSortedChats = $derived(
		(() => {
			let filtered = data.chats.filter((chat) => {
				if (searchQuery && !chat.title.toLowerCase().includes(searchQuery.toLowerCase())) {
					return false;
				}

				if (filterBy === 'pinned' && !chat.pinned) return false;
				if (filterBy === 'unpinned' && chat.pinned) return false;

				if (filterByModel && chat.lastModelUsed?.id !== filterByModel) return false;

				return true;
			});

			filtered.sort((a, b) => {
				switch (sortBy) {
					case 'newest':
						return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
					case 'oldest':
						return new Date(a.lastMessageAt).getTime() - new Date(b.lastMessageAt).getTime();
					case 'title-asc':
						return a.title.localeCompare(b.title);
					case 'title-desc':
						return b.title.localeCompare(a.title);
					case 'messages-asc':
						return a.messageCount - b.messageCount;
					case 'messages-desc':
						return b.messageCount - a.messageCount;
					default:
						return 0;
				}
			});

			return filtered;
		})()
	);

	const sortOptions = [
		{ value: 'newest' as const, label: 'Newest first' },
		{ value: 'oldest' as const, label: 'Oldest first' },
		{ value: 'title-asc' as const, label: 'A to Z' },
		{ value: 'title-desc' as const, label: 'Z to A' },
		{ value: 'messages-desc' as const, label: 'Most messages' },
		{ value: 'messages-asc' as const, label: 'Fewest messages' }
	];

	const filterOptions = [
		{ value: 'all' as const, label: 'All chats' },
		{ value: 'pinned' as const, label: 'Pinned' },
		{ value: 'unpinned' as const, label: 'Unpinned' }
	];

	function clearFilters() {
		filterBy = 'all';
		filterByModel = null;
		sortBy = 'newest';
		searchQuery = '';
	}

	const hasActiveFilters = $derived(
		filterBy !== 'all' || filterByModel !== null || sortBy !== 'newest' || searchQuery !== ''
	);

	async function refreshData() {
		await invalidateAll();
		await recentChats.refetch();
		selectedForDeletion = [];
	}

	async function updateChat(chatId: string, updates: { title?: string; pinned?: boolean }) {
		try {
			const response = await fetch(`/api/chats/${chatId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updates)
			});

			if (!response.ok) throw new Error(`Failed to update chat: ${response.status}`);

			const action = updates.title ? 'updated' : updates.pinned ? 'pinned' : 'unpinned';
			toast.success(`Chat ${action} successfully`);
			await refreshData();
		} catch (error) {
			console.error('Failed to update chat', { chatId, cause: error });
			toast.error("We couldn't update your chat right now. Please try again.");
		}
	}

	async function deleteSelectedChats() {
		try {
			const response = await fetch('/api/chats', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids: selectedForDeletion })
			});

			if (!response.ok) throw new Error('Bulk delete failed');

			toast.success(
				`${selectedForDeletion.length} chat${selectedForDeletion.length === 1 ? '' : 's'} deleted`
			);
			await refreshData();
		} catch (error) {
			console.error('Failed to delete chats', { cause: error });
			toast.error("We couldn't delete your chats right now. Please try again.");
		}
	}

	function startEdit(chatId: string, title: string) {
		editingChatId = chatId;
		editingTitle = title;
	}

	async function saveEdit() {
		if (
			editingChatId &&
			editingTitle.trim() &&
			editingTitle.trim() !== data.chats.find((c) => c.id === editingChatId)?.title
		) {
			await updateChat(editingChatId, { title: editingTitle.trim() });
		}
		editingChatId = null;
		editingTitle = '';
	}

	function cancelEdit() {
		editingChatId = null;
		editingTitle = '';
	}

	function toggleSelection(chatId: string) {
		selectedForDeletion = selectedForDeletion.includes(chatId)
			? selectedForDeletion.filter((id) => id !== chatId)
			: [...selectedForDeletion, chatId];
	}
</script>

<svelte:head>
	<title>Chats</title>
</svelte:head>

<div class="mx-auto flex h-screen max-w-4xl flex-col p-4">
	<header class="flex-shrink-0 pt-16 pb-6">
		<div class="flex items-center justify-between">
			<div class="space-y-1">
				<h1 class="text-2xl font-bold tracking-tight">Chats</h1>
				<p class="text-muted-foreground text-sm">Manage and organize your chats.</p>
			</div>
		</div>
	</header>

	<div class="mb-4 flex flex-shrink-0 items-center gap-2">
		<div class="relative flex-1">
			<IconSearch class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
			<Input bind:value={searchQuery} placeholder="Search chats..." class="h-9 pl-9" />
			{#if searchQuery}
				<Button
					variant="ghost"
					size="icon"
					class="absolute top-1/2 right-1 size-7 -translate-y-1/2"
					onclick={() => (searchQuery = '')}
				>
					<IconX class="size-4" />
				</Button>
			{/if}
		</div>

		<DropdownMenu>
			<DropdownMenuTrigger>
				{#snippet child({ props })}
					<Button variant="outline" class="h-9 gap-2" {...props}>
						<IconSortAscending class="size-4" />
						Sort & Filter
						{#if hasActiveFilters && !searchQuery}
							<div class="bg-primary size-1.5 rounded-full"></div>
						{/if}
					</Button>
				{/snippet}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" class="w-56">
				<DropdownMenuLabel>Sort by</DropdownMenuLabel>
				{#each sortOptions as option (option.value)}
					<DropdownMenuItem
						class="text-sm {sortBy === option.value ? 'bg-accent' : ''}"
						onclick={() => (sortBy = option.value)}
					>
						{option.label}
						{#if sortBy === option.value}
							<IconCheck class="ml-auto size-4" />
						{/if}
					</DropdownMenuItem>
				{/each}

				<DropdownMenuSeparator />
				<DropdownMenuLabel>Filter by pin status</DropdownMenuLabel>
				{#each filterOptions as option (option.value)}
					<DropdownMenuItem
						class="text-sm {filterBy === option.value ? 'bg-accent' : ''}"
						onclick={() => (filterBy = option.value)}
					>
						{option.label}
						{#if filterBy === option.value}
							<IconCheck class="ml-auto size-4" />
						{/if}
					</DropdownMenuItem>
				{/each}

				{#if availableModels.length > 0}
					<DropdownMenuSeparator />
					<DropdownMenuLabel>Filter by model</DropdownMenuLabel>
					<DropdownMenuItem
						class="text-sm {filterByModel === null ? 'bg-accent' : ''}"
						onclick={() => (filterByModel = null)}
					>
						All models
						{#if filterByModel === null}
							<IconCheck class="ml-auto size-4" />
						{/if}
					</DropdownMenuItem>
					{#each availableModels as model (model.id)}
						<DropdownMenuItem
							class="text-sm {filterByModel === model.id ? 'bg-accent' : ''}"
							onclick={() => (filterByModel = model.id || null)}
						>
							{model.name}
							{#if filterByModel === model.id}
								<IconCheck class="ml-auto size-4" />
							{/if}
						</DropdownMenuItem>
					{/each}
				{/if}

				{#if hasActiveFilters && !searchQuery}
					<DropdownMenuSeparator />
					<DropdownMenuItem onclick={clearFilters} class="text-sm">
						<IconX class="mr-2 size-4" />
						Clear filters
					</DropdownMenuItem>
				{/if}
			</DropdownMenuContent>
		</DropdownMenu>
	</div>

	<div class="mb-4 flex h-9 flex-shrink-0 items-center">
		{#if selectedForDeletion.length > 0}
			<div
				class="flex w-full items-center justify-between"
				transition:fly={{ y: -10, duration: 200, easing: quintOut }}
			>
				<span class="text-sm font-medium">{selectedForDeletion.length} selected</span>
				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onclick={() => (selectedForDeletion = [])}
						class="h-8"
					>
						Cancel
					</Button>
					<Button variant="destructive" size="sm" onclick={deleteSelectedChats} class="h-8 gap-1.5">
						<IconTrash class="size-3.5" />
						Delete
					</Button>
				</div>
			</div>
		{:else}
			<div class="text-muted-foreground text-sm">
				{filteredAndSortedChats.length} chat{filteredAndSortedChats.length === 1 ? '' : 's'}
			</div>
		{/if}
	</div>

	<div class="space-y-2 pb-4">
		{#if filteredAndSortedChats.length === 0}
			<div class="flex flex-col items-center justify-center pt-24 text-center">
				{#if hasActiveFilters}
					<div class="text-muted-foreground mb-4">
						<IconFilter class="mx-auto mb-3 size-8 opacity-50" />
						<h3 class="mb-1 font-semibold">No chats found</h3>
						<p class="text-sm">Try adjusting your search or filter settings.</p>
					</div>
					<Button variant="outline" size="sm" onclick={clearFilters}>Clear filters</Button>
				{:else}
					<div class="text-muted-foreground mb-4">
						<IconMessage class="mx-auto mb-3 size-8 opacity-50" />
						<h3 class="mb-1 font-semibold">No conversations yet</h3>
						<p class="text-sm">Start a new chat to see it here.</p>
					</div>
				{/if}
			</div>
		{:else}
			{#each filteredAndSortedChats as chat, i (chat.id)}
				{@const isSelected = selectedForDeletion.includes(chat.id)}
				{@const hasAnySelected = selectedForDeletion.length > 0}
				{@const isEditing = editingChatId === chat.id}

				<div
					class="group relative"
					in:fly={{ y: 20, duration: 300, delay: i * 30, easing: quintOut }}
				>
					{#if isEditing}
						<div class="bg-card flex items-center gap-2 rounded-lg border p-2.5">
							<Input
								bind:value={editingTitle}
								placeholder="Chat title..."
								class="h-8 flex-1 text-sm"
								autofocus
								onkeydown={(e) => {
									if (e.key === 'Enter') saveEdit();
									if (e.key === 'Escape') cancelEdit();
								}}
							/>
							<div class="flex gap-1">
								<Button size="icon" class="size-8" onclick={saveEdit}>
									<IconCheck class="size-4" />
								</Button>
								<Button size="icon" variant="ghost" class="size-8" onclick={cancelEdit}>
									<IconX class="size-4" />
								</Button>
							</div>
						</div>
					{:else}
						<button
							class="border-border/60 hover:border-border flex w-full items-center gap-4 rounded-lg border p-3 text-left transition-all {isSelected
								? 'bg-primary/10 border-primary/20 ring-primary/20 ring-1'
								: hasAnySelected
									? 'opacity-60 hover:opacity-100'
									: 'hover:bg-accent/50'}"
							onclick={() =>
								hasAnySelected ? toggleSelection(chat.id) : goto(`/chats/${chat.id}`)}
						>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<h3 class="truncate text-sm font-medium">{chat.title}</h3>

									{#if !hasAnySelected && chat.pinned}
										<IconPinFilled class="text-primary size-3.5 flex-shrink-0" />
									{/if}
								</div>
								<div class="text-muted-foreground mt-1.5 flex items-center gap-2 text-xs">
									<span>{timeAgo(chat.lastMessageAt)}</span>
									<span class="text-muted-foreground/60">•</span>
									<span>{chat.messageCount} message{chat.messageCount === 1 ? '' : 's'}</span>
									{#if chat.lastModelUsed}
										<span class="text-muted-foreground/60">•</span>
										<span class="truncate">{chat.lastModelUsed.name}</span>
									{/if}
								</div>
							</div>

							<div class="flex-shrink-0">
								{#if hasAnySelected}
									<div
										class="border-primary flex size-5 items-center justify-center rounded-full border-2 {isSelected
											? 'bg-primary'
											: 'bg-transparent'}"
									>
										{#if isSelected}
											<IconCheck class="text-primary-foreground size-3" />
										{/if}
									</div>
								{:else}
									<div
										class="transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100"
									>
										<DropdownMenu>
											<DropdownMenuTrigger onclick={(e) => e.stopPropagation()}>
												{#snippet child({ props })}
													<Button size="icon" variant="ghost" class="size-8" {...props}>
														<IconDots class="size-4" />
													</Button>
												{/snippet}
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" class="w-40">
												<DropdownMenuItem
													class="text-sm"
													onclick={() => updateChat(chat.id, { pinned: !chat.pinned })}
												>
													{#if chat.pinned}
														<IconPin class="mr-2 size-4" /> Unpin
													{:else}
														<IconPinFilled class="mr-2 size-4" /> Pin
													{/if}
												</DropdownMenuItem>
												<DropdownMenuItem
													class="text-sm"
													onclick={() => startEdit(chat.id, chat.title)}
												>
													<IconEdit class="mr-2 size-4" /> Rename
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													class="text-destructive focus:text-destructive text-sm"
													onclick={() => toggleSelection(chat.id)}
												>
													<IconTrash class="mr-2 size-4" />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								{/if}
							</div>
						</button>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>
