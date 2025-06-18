<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	import IconSearch from '~icons/tabler/search';
	import IconEdit from '~icons/tabler/edit';
	import IconTrash from '~icons/tabler/trash';
	import IconCheck from '~icons/tabler/check';
	import IconX from '~icons/tabler/x';
	import IconFilter from '~icons/tabler/filter';
	import IconSortAscending from '~icons/tabler/sort-ascending';
	import IconDots from '~icons/tabler/dots';
	import IconDownload from '~icons/tabler/download';
	import IconSparkles from '~icons/tabler/sparkles';
	import IconPhoto from '~icons/tabler/photo';
	import IconVideo from '~icons/tabler/video';
	import IconMusic from '~icons/tabler/music';
	import IconFileText from '~icons/tabler/file-text';
	import IconList from '~icons/tabler/list';
	import IconLayoutGrid from '~icons/tabler/layout-grid';
	import IconEye from '~icons/tabler/eye';

	import AudioPlayer from '$lib/components/audio-player';
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
	import { getMediaIcon } from '$lib/files';
	import { getModelName } from '$lib/models';
	import { timeAgo } from '$lib/utils/time';
	import { RecentFiles } from '$lib/stores/recent-files.svelte';

	const recentFiles = RecentFiles.fromContext();

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let selectedForDeletion = $state<string[]>([]);
	let editingItemId = $state<string | null>(null);
	let editingTitle = $state('');
	let viewMode = $state<'list' | 'gallery'>('gallery');

	let sortBy = $state<'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'type-asc' | 'type-desc'>(
		'newest'
	);
	let filterByType = $state<string | null>(null);

	function isImage(mediaType: string): boolean {
		return mediaType.startsWith('image/');
	}

	function isVideo(mediaType: string): boolean {
		return mediaType.startsWith('video/');
	}

	function isAudio(mediaType: string): boolean {
		return mediaType.startsWith('audio/');
	}

	function getCreationTypeIcon(type: string) {
		switch (type) {
			case 'image':
				return IconPhoto;
			case 'video':
				return IconVideo;
			case 'audio':
				return IconMusic;
			case 'document':
				return IconFileText;
			default:
				return IconSparkles;
		}
	}

	function getFriendlyCreationType(type: string): string {
		const typeNames: Record<string, string> = {
			image: 'Image',
			video: 'Video',
			audio: 'Audio',
			document: 'Document'
		};
		return typeNames[type] || type;
	}

	const availableTypes = $derived(
		Array.from(new Set(data.creations.map((creation) => creation.type))).map((type) => ({
			id: type,
			name: getFriendlyCreationType(type),
			icon: getCreationTypeIcon(type)
		}))
	);

	const filteredAndSortedCreations = $derived(
		(() => {
			let filtered = data.creations.filter((creation) => {
				const searchTerm = searchQuery.toLowerCase();

				if (searchQuery && !creation.title.toLowerCase().includes(searchTerm)) {
					return false;
				}

				if (filterByType && creation.type !== filterByType) {
					return false;
				}

				return true;
			});

			filtered.sort((a, b) => {
				switch (sortBy) {
					case 'newest':
						return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
					case 'oldest':
						return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
					case 'title-asc':
						return a.title.localeCompare(b.title);
					case 'title-desc':
						return b.title.localeCompare(a.title);
					case 'type-asc':
						return a.type.localeCompare(b.type);
					case 'type-desc':
						return b.type.localeCompare(a.type);
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
		{ value: 'type-asc' as const, label: 'Type A-Z' },
		{ value: 'type-desc' as const, label: 'Type Z-A' }
	];

	function clearFilters() {
		filterByType = null;
		sortBy = 'newest';
		searchQuery = '';
	}

	const hasActiveFilters = $derived(
		filterByType !== null || sortBy !== 'newest' || searchQuery !== ''
	);

	async function refreshData() {
		await invalidateAll();
		await recentFiles.refetch();
		selectedForDeletion = [];
	}

	async function updateCreationTitle(creationId: string, newTitle: string) {
		try {
			const response = await fetch(`/api/creations/${creationId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: newTitle })
			});

			if (!response.ok) throw new Error(`Failed to update creation: ${response.status}`);

			toast.success('Creation title updated successfully');
			await refreshData();
		} catch (error) {
			console.error('Failed to update creation title', { creationId, cause: error });
			toast.error("We couldn't update your creation title right now. Please try again.");
		}
	}

	async function deleteCreations(ids: string[]) {
		try {
			const response = await fetch('/api/creations', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids })
			});

			if (!response.ok) throw new Error('Delete failed');

			toast.success(`${ids.length} creation${ids.length === 1 ? '' : 's'} deleted successfully`);
			await refreshData();
		} catch (error) {
			console.error('Failed to delete creations', { cause: error });
			toast.error("We couldn't delete your creations right now. Please try again.");
		}
	}

	function startEdit(creationId: string, title: string) {
		editingItemId = creationId;
		editingTitle = title;
	}

	async function saveEdit() {
		if (editingItemId && editingTitle.trim()) {
			const creation = data.creations.find((c) => c.id === editingItemId);
			if (creation && editingTitle.trim() !== creation.title) {
				await updateCreationTitle(editingItemId, editingTitle.trim());
			}
		}
		editingItemId = null;
		editingTitle = '';
	}

	function cancelEdit() {
		editingItemId = null;
		editingTitle = '';
	}

	function toggleSelection(creationId: string) {
		selectedForDeletion = selectedForDeletion.includes(creationId)
			? selectedForDeletion.filter((id) => id !== creationId)
			: [...selectedForDeletion, creationId];
	}

	function downloadFile(creation: { file: { url: string; name: string } }) {
		const link = document.createElement('a');
		link.href = creation.file.url;
		link.download = creation.file.name;
		link.click();
	}

	function openFile(creation: { file: { url: string } }) {
		window.open(creation.file.url, '_blank');
	}
</script>

<svelte:head>
	<title>Creations</title>
</svelte:head>

<div class="mx-auto flex h-screen max-w-4xl flex-col p-4">
	<header class="flex-shrink-0 pt-16 pb-6">
		<div class="flex items-center justify-between">
			<div class="space-y-1">
				<h1 class="text-2xl font-bold tracking-tight">Creations</h1>
				<p class="text-muted-foreground text-sm">Browse your AI-generated creations.</p>
			</div>
			<div class="flex items-center gap-2">
				<div class="bg-muted/50 flex rounded-lg p-1">
					<Button
						variant={viewMode === 'list' ? 'secondary' : 'ghost'}
						size="icon"
						onclick={() => (viewMode = 'list')}
						class="size-8"
					>
						<IconList class="size-4" />
					</Button>
					<Button
						variant={viewMode === 'gallery' ? 'secondary' : 'ghost'}
						size="icon"
						onclick={() => (viewMode = 'gallery')}
						class="size-8"
					>
						<IconLayoutGrid class="size-4" />
					</Button>
				</div>
			</div>
		</div>
	</header>

	<div class="mb-4 flex flex-shrink-0 items-center gap-2">
		<div class="relative flex-1">
			<IconSearch class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
			<Input bind:value={searchQuery} placeholder="Search creations..." class="h-9 pl-9" />
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

				<DropdownMenuLabel>Filter by type</DropdownMenuLabel>
				<DropdownMenuItem
					class="text-sm {filterByType === null ? 'bg-accent' : ''}"
					onclick={() => (filterByType = null)}
				>
					All types
					{#if filterByType === null}
						<IconCheck class="ml-auto size-4" />
					{/if}
				</DropdownMenuItem>
				{#each availableTypes as creationType (creationType.id)}
					<DropdownMenuItem
						class="text-sm {filterByType === creationType.id ? 'bg-accent' : ''}"
						onclick={() => (filterByType = creationType.id)}
					>
						{creationType.name}
						{#if filterByType === creationType.id}
							<IconCheck class="ml-auto size-4" />
						{/if}
					</DropdownMenuItem>
				{/each}

				{#if hasActiveFilters}
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
					<Button
						variant="destructive"
						size="sm"
						onclick={() => deleteCreations(selectedForDeletion)}
						class="h-8 gap-1.5"
					>
						<IconTrash class="size-3.5" />
						Delete
					</Button>
				</div>
			</div>
		{:else}
			<div class="text-muted-foreground text-sm">
				{filteredAndSortedCreations.length} creation{filteredAndSortedCreations.length === 1
					? ''
					: 's'}
			</div>
		{/if}
	</div>

	<div class="pb-4">
		{#if filteredAndSortedCreations.length === 0}
			<div class="flex flex-col items-center justify-center pt-24 text-center">
				{#if hasActiveFilters}
					<div class="text-muted-foreground mb-4">
						<IconFilter class="mx-auto mb-3 size-8 opacity-50" />
						<h3 class="mb-1 font-semibold">No creations found</h3>
						<p class="text-sm">Try adjusting your search or filter settings.</p>
					</div>
					<Button variant="outline" size="sm" onclick={clearFilters}>Clear filters</Button>
				{:else}
					<div class="text-muted-foreground mb-4">
						<IconSparkles class="mx-auto mb-3 size-8 text-amber-500 opacity-50" />
						<h3 class="mb-1 font-semibold">No AI creations yet</h3>
						<p class="text-sm">Your AI-generated content will appear here.</p>
					</div>
				{/if}
			</div>
		{:else if viewMode === 'list'}
			<div class="space-y-2">
				{#each filteredAndSortedCreations as creation, i (creation.id)}
					{@const isSelected = selectedForDeletion.includes(creation.id)}
					{@const hasAnySelected = selectedForDeletion.length > 0}
					{@const isEditing = editingItemId === creation.id}
					{@const isImageFile = isImage(creation.file.mediaType)}
					{@const isAudioFile = isAudio(creation.file.mediaType)}
					{@const thumbnailUrl = isImageFile ? creation.file.url : null}

					<div
						class="group relative"
						in:fly={{ y: 20, duration: 300, delay: i * 30, easing: quintOut }}
					>
						{#if isEditing}
							<div class="bg-card flex items-center gap-2 rounded-lg border p-2.5">
								<Input
									bind:value={editingTitle}
									placeholder="Creation title..."
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
								onclick={() => {
									if (hasAnySelected) {
										toggleSelection(creation.id);
									} else if (!isAudioFile) {
										openFile(creation);
									}
								}}
							>
								{#if thumbnailUrl}
									<div
										class="bg-muted/50 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded"
									>
										<img
											src={thumbnailUrl}
											alt={creation.title}
											class="h-full w-full rounded object-cover"
										/>
									</div>
								{/if}
								<div class="min-w-0 flex-1">
									{#if isAudioFile}
										<AudioPlayer
											file={creation.file}
											variant="list"
											title={creation.title}
											creationType={getFriendlyCreationType(creation.type)}
											modelName={creation.metadata?.model?.id
												? getModelName(creation.metadata.model.id)
												: 'Unknown model'}
										/>
									{:else}
										<h3 class="truncate text-sm font-medium">{creation.title}</h3>
										<div class="text-muted-foreground mt-1.5 flex items-center gap-2 text-xs">
											<span>{getFriendlyCreationType(creation.type)}</span>
											<span class="text-muted-foreground/60">•</span>
											<span
												>{creation.metadata?.model?.id
													? getModelName(creation.metadata.model.id)
													: 'Unknown model'}</span
											>
										</div>
									{/if}
								</div>

								<div class="flex flex-shrink-0 items-center gap-4">
									<div class="text-muted-foreground hidden text-xs sm:block">
										{timeAgo(creation.createdAt)}
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
												class="opacity-0 transition-opacity duration-200 group-hover:opacity-100"
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
														<DropdownMenuItem class="text-sm" onclick={() => openFile(creation)}>
															<IconEye class="mr-2 size-4" /> View
														</DropdownMenuItem>
														<DropdownMenuItem
															class="text-sm"
															onclick={() => downloadFile(creation)}
														>
															<IconDownload class="mr-2 size-4" /> Download
														</DropdownMenuItem>
														<DropdownMenuItem
															class="text-sm"
															onclick={() => startEdit(creation.id, creation.title)}
														>
															<IconEdit class="mr-2 size-4" /> Rename
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															class="text-destructive focus:text-destructive text-sm"
															onclick={() => toggleSelection(creation.id)}
														>
															<IconTrash class="mr-2 size-4" />
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										{/if}
									</div>
								</div>
							</button>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
				{#each filteredAndSortedCreations as creation, i (creation.id)}
					{@const isSelected = selectedForDeletion.includes(creation.id)}
					{@const hasAnySelected = selectedForDeletion.length > 0}
					{@const isEditing = editingItemId === creation.id}
					{@const isImageFile = isImage(creation.file.mediaType)}
					{@const isVideoFile = isVideo(creation.file.mediaType)}
					{@const isAudioFile = isAudio(creation.file.mediaType)}
					{@const thumbnailUrl = isImageFile ? creation.file.url : null}
					{@const IconToRender = getMediaIcon(creation.file.mediaType)}

					<div
						class="group relative"
						in:fly={{ y: 20, duration: 300, delay: i * 30, easing: quintOut }}
					>
						{#if isEditing}
							<div class="bg-card space-y-2 rounded-lg border p-2">
								<div class="bg-muted/50 relative aspect-square w-full rounded-md">
									{#if thumbnailUrl}
										<img
											src={thumbnailUrl}
											alt={creation.title}
											class="h-full w-full rounded-md object-cover"
										/>
									{:else}
										<div class="flex h-full w-full items-center justify-center">
											<IconToRender class="text-muted-foreground size-8" />
										</div>
									{/if}
								</div>
								<Input
									bind:value={editingTitle}
									placeholder="Creation title..."
									class="h-8 text-xs"
									autofocus
									onkeydown={(e) => {
										if (e.key === 'Enter') saveEdit();
										if (e.key === 'Escape') cancelEdit();
									}}
								/>
								<div class="flex gap-1">
									<Button size="sm" onclick={saveEdit} class="h-7 flex-1 text-xs">Save</Button>
									<Button size="sm" variant="ghost" onclick={cancelEdit} class="h-7 flex-1 text-xs">
										Cancel
									</Button>
								</div>
							</div>
						{:else}
							<div
								class="relative w-full cursor-pointer text-left"
								onclick={() => {
									if (hasAnySelected) {
										toggleSelection(creation.id);
									} else if (!isAudioFile) {
										openFile(creation);
									}
								}}
								role="button"
								tabindex="0"
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										if (hasAnySelected) {
											toggleSelection(creation.id);
										} else if (!isAudioFile) {
											openFile(creation);
										}
									}
								}}
							>
								<div
									class="overflow-hidden rounded-lg border transition-all {isSelected
										? 'border-primary/50 ring-primary/50 ring-2'
										: 'group-hover:border-border border-transparent'}"
								>
									<div class="bg-muted/50 aspect-square w-full overflow-hidden">
										{#if thumbnailUrl}
											<img
												src={thumbnailUrl}
												alt={creation.title}
												class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
											/>
										{:else if isAudioFile}
											<AudioPlayer file={creation.file} variant="gallery" />
										{:else}
											<div class="flex h-full w-full items-center justify-center">
												<IconToRender class="text-muted-foreground size-8 md:size-12" />
											</div>
										{/if}
										{#if isVideoFile}
											<div
												class="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50"
											>
												<IconVideo class="size-8 text-white" />
											</div>
										{/if}
									</div>
								</div>

								<div class="absolute top-0 right-0 p-2">
									{#if hasAnySelected}
										<div
											class="bg-background/80 flex size-6 items-center justify-center rounded-full border-2 backdrop-blur-sm transition-all {isSelected
												? 'border-primary bg-primary'
												: 'border-muted-foreground/50 group-hover:border-primary'}"
										>
											{#if isSelected}
												<IconCheck class="text-primary-foreground size-3.5" />
											{/if}
										</div>
									{:else}
										<div class="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
											<DropdownMenu>
												<DropdownMenuTrigger
													onclick={(e) => e.stopPropagation()}
													class="bg-background/80 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-sm"
												>
													<IconDots class="size-4" />
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" class="w-40">
													<DropdownMenuItem class="text-sm" onclick={() => openFile(creation)}>
														<IconEye class="mr-2 size-4" /> View
													</DropdownMenuItem>
													<DropdownMenuItem class="text-sm" onclick={() => downloadFile(creation)}>
														<IconDownload class="mr-2 size-4" /> Download
													</DropdownMenuItem>
													<DropdownMenuItem
														class="text-sm"
														onclick={() => startEdit(creation.id, creation.title)}
													>
														<IconEdit class="mr-2 size-4" /> Rename
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														class="text-destructive focus:text-destructive text-sm"
														onclick={() => toggleSelection(creation.id)}
													>
														<IconTrash class="mr-2 size-4" />
														Delete
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									{/if}
								</div>

								<div class="mt-2">
									<h3 class="truncate text-sm font-medium" title={creation.title}>
										{creation.title}
									</h3>
									<div class="text-muted-foreground flex items-center gap-1.5 text-xs">
										<span
											>{creation.metadata?.model?.id
												? getModelName(creation.metadata.model.id)
												: 'Unknown model'}</span
										>
									</div>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
