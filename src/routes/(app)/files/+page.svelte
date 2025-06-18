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
	import IconFile from '~icons/tabler/file';
	import IconSparkles from '~icons/tabler/sparkles';

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
	import { getMediaIcon, getFriendlyMediaType, formatBytes } from '$lib/files';
	import { RecentFiles } from '$lib/stores/recent-files.svelte';
	import { timeAgo } from '$lib/utils/time';

	let { data }: { data: PageData } = $props();

	const recentFiles = RecentFiles.fromContext();

	let searchQuery = $state('');
	let selectedForDeletion = $state<string[]>([]);
	let editingItemId = $state<string | null>(null);
	let editingName = $state('');

	let sortBy = $state<'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc'>(
		'newest'
	);
	let filterByType = $state<string | null>(null);
	let filterByCreation = $state<'all' | 'creations' | 'files'>('all');

	function isImage(mediaType: string): boolean {
		return mediaType.startsWith('image/');
	}

	function isAudio(mediaType: string): boolean {
		return mediaType.startsWith('audio/');
	}

	const availableFileTypes = $derived(
		Array.from(new Set(data.files.map((file) => file.mediaType))).map((type) => ({
			id: type,
			name: getFriendlyMediaType(type)
		}))
	);

	const filteredAndSortedFiles = $derived(
		(() => {
			let filtered = data.files.filter((file) => {
				const searchTerm = searchQuery.toLowerCase();

				if (searchQuery && !file.name.toLowerCase().includes(searchTerm)) {
					return false;
				}

				if (filterByType && file.mediaType !== filterByType) {
					return false;
				}

				if (filterByCreation === 'creations' && !file.isCreation) {
					return false;
				}

				if (filterByCreation === 'files' && file.isCreation) {
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
					case 'name-asc':
						return a.name.localeCompare(b.name);
					case 'name-desc':
						return b.name.localeCompare(a.name);
					case 'size-desc':
						return b.size - a.size;
					case 'size-asc':
						return a.size - b.size;
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
		{ value: 'name-asc' as const, label: 'A to Z' },
		{ value: 'name-desc' as const, label: 'Z to A' },
		{ value: 'size-desc' as const, label: 'Largest first' },
		{ value: 'size-asc' as const, label: 'Smallest first' }
	];

	const creationFilterOptions = [
		{ value: 'all' as const, label: 'All files' },
		{ value: 'creations' as const, label: 'AI creations' },
		{ value: 'files' as const, label: 'Uploaded files' }
	];

	function clearFilters() {
		filterByType = null;
		filterByCreation = 'all';
		sortBy = 'newest';
		searchQuery = '';
	}

	const hasActiveFilters = $derived(
		filterByType !== null || filterByCreation !== 'all' || sortBy !== 'newest' || searchQuery !== ''
	);

	async function refreshData() {
		await invalidateAll();
		await recentFiles.refetch();
		selectedForDeletion = [];
	}

	async function updateFileName(fileId: string, newName: string) {
		try {
			const response = await fetch(`/api/files/${fileId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newName })
			});

			if (!response.ok) throw new Error(`Failed to update file: ${response.status}`);

			toast.success('File name updated successfully');
			await refreshData();
		} catch (error) {
			console.error('Failed to update file name', { fileId, cause: error });
			toast.error("We couldn't update your file name right now. Please try again.");
		}
	}

	async function deleteFiles(ids: string[]) {
		try {
			const response = await fetch('/api/files', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids })
			});

			if (!response.ok) throw new Error('Delete failed');

			toast.success(`${ids.length} file${ids.length === 1 ? '' : 's'} deleted successfully`);
			await refreshData();
		} catch (error) {
			console.error('Failed to delete files', { cause: error });
			toast.error("We couldn't delete your files right now. Please try again.");
		}
	}

	function startEdit(fileId: string, name: string) {
		editingItemId = fileId;
		editingName = name;
	}

	async function saveEdit() {
		if (editingItemId && editingName.trim()) {
			const file = data.files.find((f) => f.id === editingItemId);
			if (file && editingName.trim() !== file.name) {
				await updateFileName(editingItemId, editingName.trim());
			}
		}
		editingItemId = null;
		editingName = '';
	}

	function cancelEdit() {
		editingItemId = null;
		editingName = '';
	}

	function toggleSelection(fileId: string) {
		selectedForDeletion = selectedForDeletion.includes(fileId)
			? selectedForDeletion.filter((id) => id !== fileId)
			: [...selectedForDeletion, fileId];
	}

	function downloadFile(file: { url: string; name: string }) {
		const link = document.createElement('a');
		link.href = file.url;
		link.download = file.name;
		link.click();
	}

	function openFile(file: { url: string }) {
		window.open(file.url, '_blank');
	}
</script>

<svelte:head>
	<title>Files</title>
</svelte:head>

<div class="mx-auto flex h-screen max-w-4xl flex-col p-4">
	<header class="flex-shrink-0 pt-16 pb-6">
		<div class="flex items-center justify-between">
			<div class="space-y-1">
				<h1 class="text-2xl font-bold tracking-tight">Files</h1>
				<p class="text-muted-foreground text-sm">Manage your uploaded files and creations.</p>
			</div>
		</div>
	</header>

	<div class="mb-4 flex flex-shrink-0 items-center gap-2">
		<div class="relative flex-1">
			<IconSearch class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
			<Input bind:value={searchQuery} placeholder="Search files..." class="h-9 pl-9" />
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
				<DropdownMenuLabel>Filter by source</DropdownMenuLabel>
				{#each creationFilterOptions as option (option.value)}
					<DropdownMenuItem
						class="text-sm {filterByCreation === option.value ? 'bg-accent' : ''}"
						onclick={() => (filterByCreation = option.value)}
					>
						{option.label}
						{#if filterByCreation === option.value}
							<IconCheck class="ml-auto size-4" />
						{/if}
					</DropdownMenuItem>
				{/each}

				{#if availableFileTypes.length > 0}
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
					{#each availableFileTypes as fileType (fileType.id)}
						<DropdownMenuItem
							class="text-sm {filterByType === fileType.id ? 'bg-accent' : ''}"
							onclick={() => (filterByType = fileType.id)}
						>
							{fileType.name}
							{#if filterByType === fileType.id}
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
					<Button
						variant="destructive"
						size="sm"
						onclick={() => deleteFiles(selectedForDeletion)}
						class="h-8 gap-1.5"
					>
						<IconTrash class="size-3.5" />
						Delete
					</Button>
				</div>
			</div>
		{:else}
			<div class="text-muted-foreground text-sm">
				{filteredAndSortedFiles.length} file{filteredAndSortedFiles.length === 1 ? '' : 's'}
			</div>
		{/if}
	</div>

	<div class="space-y-2 pb-4">
		{#if filteredAndSortedFiles.length === 0}
			<div class="flex flex-col items-center justify-center pt-24 text-center">
				{#if hasActiveFilters}
					<div class="text-muted-foreground mb-4">
						<IconFilter class="mx-auto mb-3 size-8 opacity-50" />
						<h3 class="mb-1 font-semibold">No files found</h3>
						<p class="text-sm">Try adjusting your search or filter settings.</p>
					</div>
					<Button variant="outline" size="sm" onclick={clearFilters}>Clear filters</Button>
				{:else}
					<div class="text-muted-foreground mb-4">
						<IconFile class="mx-auto mb-3 size-8 opacity-50" />
						<h3 class="mb-1 font-semibold">No files yet</h3>
						<p class="text-sm">Your uploaded files and creations will appear here.</p>
					</div>
				{/if}
			</div>
		{:else}
			{#each filteredAndSortedFiles as file, i (file.id)}
				{@const isSelected = selectedForDeletion.includes(file.id)}
				{@const hasAnySelected = selectedForDeletion.length > 0}
				{@const isEditing = editingItemId === file.id}
				{@const isImageFile = isImage(file.mediaType)}
				{@const isAudioFile = isAudio(file.mediaType)}
				{@const thumbnailUrl = isImageFile ? file.url : null}
				{@const IconToRender = getMediaIcon(file.mediaType)}

				<div
					class="group relative"
					in:fly={{ y: 20, duration: 300, delay: i * 30, easing: quintOut }}
				>
					{#if isEditing}
						<div class="bg-card flex items-center gap-2 rounded-lg border p-2.5">
							<Input
								bind:value={editingName}
								placeholder="File name..."
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
						<div
							class="border-border/60 hover:border-border flex w-full cursor-pointer items-center gap-3 rounded-lg border p-2.5 text-left transition-all sm:gap-4 sm:p-3 {isSelected
								? 'bg-primary/10 border-primary/20 ring-primary/20 ring-1'
								: hasAnySelected
									? 'opacity-60 hover:opacity-100'
									: 'hover:bg-accent/50'}"
							role="button"
							tabindex="0"
							onclick={() => (hasAnySelected ? toggleSelection(file.id) : openFile(file))}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									if (hasAnySelected) {
										toggleSelection(file.id);
									} else {
										openFile(file);
									}
								}
							}}
						>
							{#if isAudioFile}
								<div class="min-w-0 flex-1">
									<AudioPlayer
										{file}
										variant="file"
										timeAgoDisplay={timeAgo(file.createdAt)}
										formattedSize={formatBytes(file.size)}
									/>
								</div>
							{:else}
								<div
									class="bg-muted/50 flex size-10 flex-shrink-0 items-center justify-center rounded"
								>
									{#if thumbnailUrl}
										<img
											src={thumbnailUrl}
											alt={file.name}
											class="h-full w-full rounded object-cover"
										/>
									{:else}
										<IconToRender class="text-muted-foreground size-5" />
									{/if}
								</div>

								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<h3 class="truncate text-sm font-medium">{file.name}</h3>
										{#if file.isCreation}
											<IconSparkles class="size-4 flex-shrink-0 text-amber-500" />
										{/if}
									</div>
									<div class="text-muted-foreground mt-1.5 flex items-center gap-2 text-xs">
										<span>{formatBytes(file.size)}</span>
										<span class="text-muted-foreground/60">•</span>
										<span>{timeAgo(file.createdAt)}</span>
									</div>
								</div>
							{/if}

							<div class="flex flex-shrink-0 items-center">
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
											class="opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100"
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
													<DropdownMenuItem class="text-sm" onclick={() => downloadFile(file)}>
														<IconDownload class="mr-2 size-4" /> Download
													</DropdownMenuItem>
													<DropdownMenuItem
														class="text-sm"
														onclick={() => startEdit(file.id, file.name)}
													>
														<IconEdit class="mr-2 size-4" /> Rename
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														class="text-destructive focus:text-destructive text-sm"
														onclick={() => toggleSelection(file.id)}
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
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>
