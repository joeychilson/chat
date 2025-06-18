<script lang="ts">
	import { toast } from 'svelte-sonner';

	import IconFiles from '~icons/tabler/files';
	import IconCloudUpload from '~icons/tabler/cloud-upload';

	import { Button } from '$lib/components/ui/button';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { type File, type AllowedFileType, ALLOWED_FILE_TYPES, isFileAllowed } from '$lib/files';
	import { models, type Model } from '$lib/models';
	import { RecentFiles } from '$lib/stores/recent-files.svelte';

	import FilesDropZone from './files-drop-zone.svelte';
	import FilesSearchInput from './files-search-input.svelte';
	import FilesListItem from './files-list-item.svelte';

	const recentFiles = RecentFiles.fromContext();

	interface Props {
		status: 'submitted' | 'streaming' | 'ready' | 'error';
		model: Model;
		uploading: boolean;
		files: File[];
	}

	let { status, model, uploading = $bindable(), files = $bindable() }: Props = $props();

	let fileInputRef = $state<HTMLInputElement | null>(null);
	let isFileMenuOpen = $state(false);
	let isAttachedFilesMenuOpen = $state(false);
	let searchQuery = $state('');
	let searchResults = $state<File[]>([]);
	let isSearching = $state(false);
	let debounceTimeout: ReturnType<typeof setTimeout> | undefined;

	const supportedFileTypes = $derived(
		models.find((m) => m.id === model.id)?.supportedFileTypes || ALLOWED_FILE_TYPES
	);

	const availableFiles = $derived(
		recentFiles.files.slice(0, 20).filter((file) => {
			return supportedFileTypes.some((type) => file.mediaType === type);
		})
	);

	const displayFiles = $derived(searchQuery.trim() ? searchResults : availableFiles);

	const isDisabled = $derived(status === 'submitted' || uploading);

	async function handleFileUpload(fileList: FileList) {
		if (isDisabled) return;

		uploading = true;

		try {
			const newFiles: File[] = [];

			for (const file of Array.from(fileList)) {
				const validation = isFileAllowed(file);
				const detectedType = validation.detectedType || (file.type as AllowedFileType);

				if (!validation.allowed || !supportedFileTypes.includes(detectedType)) {
					toast.error(`"${file.name}" is not supported by this model.`);
					continue;
				}

				try {
					const formData = new FormData();
					formData.append('file', file);

					const response = await fetch('/api/files', {
						method: 'POST',
						body: formData
					});

					const newFile = await response.json();
					if (response.ok) {
						newFiles.push(newFile);
					} else {
						toast.error(`We couldn't upload ${file.name} right now. Please try again.`);
					}
				} catch (error) {
					console.error('Failed to upload file', { fileName: file.name, cause: error });
					toast.error(`We couldn't upload ${file.name} right now. Please try again.`);
				}
			}

			if (newFiles.length > 0) {
				files = [...files, ...newFiles];
				await recentFiles.refetch();
				toast.success(`Uploaded ${newFiles.length} file${newFiles.length === 1 ? '' : 's'}`);
			}
		} catch (error) {
			console.error('Failed to upload files', { cause: error });
			toast.error("We couldn't upload your files right now. Please try again.");
		} finally {
			uploading = false;
		}
	}

	async function handleSearch(query: string) {
		if (!query.trim()) {
			searchResults = [];
			isSearching = false;
			return;
		}

		isSearching = true;

		try {
			const response = await fetch(`/api/files?q=${encodeURIComponent(query)}`);
			const data = response.ok ? await response.json() : { files: [] };

			searchResults = data.files.filter((file: File) =>
				supportedFileTypes.some((type) => file.mediaType === type)
			);
		} catch (error) {
			console.error('Search error:', error);
			searchResults = [];
		} finally {
			isSearching = false;
		}
	}

	function handleFileSelect(file: File) {
		if (files.some((f) => f.id === file.id)) {
			files = files.filter((f) => f.id !== file.id);
			toast.success(`Removed "${file.name}"`);
			return;
		}

		files = [...files, file];
		toast.success(`Added "${file.name}"`);
	}

	function handleUploadClick() {
		fileInputRef?.click();
		isFileMenuOpen = false;
	}

	function handleFileRemove(file: File) {
		files = files.filter((f) => f.id !== file.id);
		toast.success(`Removed "${file.name}"`);
	}

	$effect(() => {
		if (!isFileMenuOpen) {
			searchQuery = '';
			searchResults = [];
			isSearching = false;
		}
	});

	$effect(() => {
		return () => {
			clearTimeout(debounceTimeout);
		};
	});
</script>

<div class="flex items-center gap-1">
	<DropdownMenu bind:open={isFileMenuOpen}>
		<DropdownMenuTrigger>
			{#snippet child({ props })}
				<Button
					{...props}
					variant="outline"
					size="icon"
					disabled={isDisabled}
					aria-label="Attach files to message"
				>
					<IconFiles class="size-4" />
				</Button>
			{/snippet}
		</DropdownMenuTrigger>

		<DropdownMenuContent class="w-64 p-0" align="start">
			<div class="border-b p-3">
				<FilesSearchInput
					bind:searchQuery
					{isSearching}
					disabled={isDisabled}
					onSearch={handleSearch}
				/>
			</div>

			<div class="max-h-80 overflow-y-auto">
				<div class="border-b p-1">
					<div class="group hover:bg-accent/50 flex h-10 items-center gap-3 rounded-md p-2">
						<IconCloudUpload class="text-muted-foreground size-4 flex-shrink-0" />
						<button
							class="min-w-0 flex-1 text-left"
							disabled={isDisabled || uploading}
							onclick={handleUploadClick}
							aria-label="Upload new files"
						>
							<span class="text-foreground hover:text-accent-foreground block truncate text-sm">
								{uploading ? 'Uploading...' : 'Upload new files'}
							</span>
						</button>
					</div>
				</div>
				{#if searchQuery.trim() !== ''}
					{#if isSearching}
						<div class="flex h-16 items-center justify-center">
							<p class="text-muted-foreground text-sm">Searching...</p>
						</div>
					{:else if displayFiles.length === 0}
						<div class="flex h-16 items-center justify-center">
							<p class="text-muted-foreground text-sm">No files found</p>
						</div>
					{:else}
						<div class="space-y-1 p-1">
							{#each displayFiles as file (file.id)}
								{@const isSelected = files.some((f) => f.id === file.id)}
								<FilesListItem
									{file}
									{isSelected}
									disabled={isDisabled}
									onSelect={handleFileSelect}
								/>
							{/each}
						</div>
					{/if}
				{:else if availableFiles.length === 0}
					<div class="flex h-16 items-center justify-center">
						<p class="text-muted-foreground text-sm">No recent files</p>
					</div>
				{:else}
					<div class="space-y-1 p-1">
						{#each availableFiles as file (file.id)}
							{@const isSelected = files.some((f) => f.id === file.id)}
							<FilesListItem
								{file}
								{isSelected}
								disabled={isDisabled}
								onSelect={handleFileSelect}
							/>
						{/each}
					</div>
				{/if}
			</div>
		</DropdownMenuContent>
	</DropdownMenu>

	{#if files.length > 0}
		<DropdownMenu bind:open={isAttachedFilesMenuOpen}>
			<DropdownMenuTrigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="outline"
						class="gap-2"
						disabled={isDisabled}
						aria-label="View attached files"
					>
						<IconFiles class="size-4" />
						<span class="text-sm font-medium">
							{files.length} file{files.length === 1 ? '' : 's'}
						</span>
					</Button>
				{/snippet}
			</DropdownMenuTrigger>

			<DropdownMenuContent class="w-64 p-0" align="start">
				<div class="border-b px-3 py-2">
					<h4 class="text-sm font-semibold">Attached Files</h4>
					<p class="text-muted-foreground text-xs">Files attached to this message</p>
				</div>
				<div class="max-h-80 space-y-1 overflow-y-auto p-1">
					{#each files as file (file.id)}
						<FilesListItem
							{file}
							isSelected={false}
							disabled={isDisabled}
							onSelect={handleFileRemove}
						/>
					{/each}
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	{/if}
</div>

<input
	bind:this={fileInputRef}
	type="file"
	multiple
	accept={supportedFileTypes.join(',')}
	style="display: none;"
	aria-label="Upload files"
	onchange={async (event) => {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			await handleFileUpload(target.files);
			target.value = '';
		}
	}}
/>

<FilesDropZone
	onFilesSelected={handleFileUpload}
	allowedTypes={supportedFileTypes}
	disabled={isDisabled}
/>
