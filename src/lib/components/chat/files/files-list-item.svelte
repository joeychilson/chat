<script lang="ts">
	import { getMediaIcon, type File } from '$lib/files';

	interface Props {
		file: File;
		isSelected?: boolean;
		disabled?: boolean;
		onSelect?: (file: File) => void;
	}

	let { file, isSelected = false, disabled = false, onSelect }: Props = $props();

	const FileIcon = getMediaIcon(file.mediaType);

	function handleMainAction() {
		if (disabled) return;
		onSelect?.(file);
	}
</script>

<div
	class="group hover:bg-accent/50 relative flex h-10 items-center gap-3 rounded-md"
	class:opacity-50={disabled}
>
	<button
		class="absolute inset-0 z-0"
		class:cursor-not-allowed={disabled}
		{disabled}
		onclick={handleMainAction}
		title={file.name}
		aria-label="Select {file.name}"
	></button>

	<div class="pointer-events-none relative z-10 flex w-full items-center gap-3 p-2">
		<FileIcon class="text-muted-foreground size-4 flex-shrink-0" />

		<div class="min-w-0 flex-1">
			<span
				class="block truncate text-sm"
				class:text-muted-foreground={isSelected}
				class:text-foreground={!isSelected}
				title={file.name}
			>
				{file.name}
			</span>
		</div>
	</div>
</div>
