<script lang="ts">
	import { isFileAllowed, type AllowedFileType } from '$lib/files';
	import { toast } from 'svelte-sonner';
	import { fade } from 'svelte/transition';

	import IconCloudUpload from '~icons/tabler/cloud-upload';

	interface Props {
		onFilesSelected: (files: FileList) => void;
		allowedTypes?: readonly AllowedFileType[];
		disabled?: boolean;
	}

	let { onFilesSelected, allowedTypes, disabled = false }: Props = $props();

	let isDraggingOver = $state(false);
	let dragCounter = $state(0);

	function validateFiles(files: FileList): boolean {
		if (disabled) return false;

		if (allowedTypes) {
			const invalidFiles = Array.from(files).filter((file) => {
				const result = isFileAllowed(file);
				return (
					!result.allowed || (result.detectedType && !allowedTypes.includes(result.detectedType))
				);
			});
			if (invalidFiles.length > 0) {
				toast.error(
					`Some files are not supported. Please select ${allowedTypes.join(', ')} files only.`
				);
				return false;
			}
		}

		return true;
	}

	function handleDragEnter(event: DragEvent) {
		if (disabled) return;

		event.preventDefault();
		event.stopPropagation();

		dragCounter++;
		if (dragCounter === 1) {
			isDraggingOver = true;
		}
	}

	function handleDragOver(event: DragEvent) {
		if (disabled) return;

		event.preventDefault();
		event.stopPropagation();
	}

	function handleDragLeave(event: DragEvent) {
		if (disabled) return;

		event.preventDefault();
		event.stopPropagation();

		dragCounter--;
		if (dragCounter === 0) {
			isDraggingOver = false;
		}
	}

	function handleDrop(event: DragEvent) {
		if (disabled) return;

		event.preventDefault();
		event.stopPropagation();

		dragCounter = 0;
		isDraggingOver = false;

		const files = event.dataTransfer?.files;
		if (files && files.length > 0 && validateFiles(files)) {
			onFilesSelected(files);
		}
	}

	export function openFileDialog() {
		if (disabled) return;

		const input = document.createElement('input');
		input.type = 'file';
		input.multiple = true;

		if (allowedTypes) {
			const extensions = allowedTypes
				.map((type) => {
					if (type.startsWith('image/')) return '.jpg,.jpeg,.png,.gif,.webp';
					if (type === 'application/pdf') return '.pdf';
					if (type.startsWith('audio/')) return '.mp3,.wav,.ogg,.m4a';
					if (type.startsWith('video/')) return '.mp4,.webm,.mov';
					return '';
				})
				.filter(Boolean)
				.join(',');

			input.accept = extensions;
		}

		input.onchange = (e) => {
			const files = (e.target as HTMLInputElement).files;
			if (files && files.length > 0 && validateFiles(files)) {
				onFilesSelected(files);
			}
		};

		input.click();
	}
</script>

<svelte:window
	ondragenter={handleDragEnter}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
/>

{#if isDraggingOver}
	<div
		class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/60"
		transition:fade={{ duration: 150 }}
	>
		<div
			class="bg-background flex flex-col items-center gap-4 rounded-lg p-8 text-center shadow-lg"
		>
			<IconCloudUpload class="text-primary size-12" />
			<p class="text-lg font-semibold">Drop files here</p>
			<p class="text-muted-foreground text-sm">Drop your files to attach them to the chat.</p>
		</div>
	</div>
{/if}

<style>
	:global(body) {
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}
</style>
