<script lang="ts">
	import type { FileUIPart } from 'ai';
	import { toast } from 'svelte-sonner';

	import IconFiles from '~icons/tabler/files';
	import IconFile from '~icons/tabler/file';
	import IconX from '~icons/tabler/x';

	import { Button } from '$lib/components/ui/button';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import type { Message } from '$lib/messages';

	interface Props {
		files: FileUIPart[];
		message: Message;
	}

	let { files, message }: Props = $props();

	let removing = $state<Set<string>>(new Set());

	async function removeFile(fileUrl: string) {
		if (removing.has(fileUrl)) return;

		removing.add(fileUrl);
		removing = new Set(removing);

		try {
			const updatedParts = message.parts.filter((part) => {
				if (part.type === 'file') {
					return part.url !== fileUrl;
				}
				return true;
			});

			const response = await fetch(`/api/messages/${message.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					parts: updatedParts
				})
			});

			if (!response.ok) {
				throw new Error('Failed to update message');
			}

			message.parts = updatedParts;

			toast.success('File removed from message');
		} catch (error) {
			console.error('Failed to remove file from message', {
				messageId: message.id,
				fileUrl,
				cause: error
			});
			toast.error("We couldn't remove the file right now. Please try again.");
		} finally {
			removing.delete(fileUrl);
			removing = new Set(removing);
		}
	}
</script>

<DropdownMenu>
	<DropdownMenuTrigger>
		{#snippet child({ props })}
			<Button
				variant="ghost"
				size="sm"
				class="gap-2"
				aria-label="View {files.length} attached file{files.length === 1 ? '' : 's'}"
				{...props}
			>
				<IconFiles class="text-muted-foreground size-4" />
				<span class="text-muted-foreground text-xs font-medium" aria-hidden="true"
					>{files.length}</span
				>
			</Button>
		{/snippet}
	</DropdownMenuTrigger>
	<DropdownMenuContent align="end" class="w-52 p-0">
		<div class="border-b px-3 py-2">
			<h4 class="text-sm font-semibold" id="files-heading">Attached Files</h4>
			<p class="text-muted-foreground text-xs">
				{files.length} file{files.length === 1 ? '' : 's'} in message
			</p>
		</div>

		<div class="max-h-64 overflow-y-auto p-1" role="list" aria-labelledby="files-heading">
			{#each files as file (file.url)}
				<div
					class="group hover:bg-accent/50 flex h-10 items-center gap-3 rounded-md p-2"
					role="listitem"
				>
					<IconFile class="text-muted-foreground size-4 flex-shrink-0" aria-hidden="true" />
					<button
						class="min-w-0 flex-1 text-left"
						aria-label="Open {file.filename} in new window"
						onclick={() => {
							window.open(file.url, '_blank', 'noopener,noreferrer');
						}}
					>
						<span
							class="text-foreground hover:text-accent-foreground block truncate text-sm"
							title={file.filename}
						>
							{file.filename}
						</span>
					</button>
					<Button
						variant="ghost"
						size="icon"
						class="size-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
						disabled={removing.has(file.url)}
						onclick={() => removeFile(file.url)}
						aria-label={removing.has(file.url)
							? `Removing ${file.filename}...`
							: `Remove ${file.filename}`}
					>
						<IconX class="size-3.5" />
					</Button>
				</div>
			{/each}
		</div>
	</DropdownMenuContent>
</DropdownMenu>
