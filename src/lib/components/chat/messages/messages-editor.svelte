<script lang="ts">
	import type { UIMessage } from '@ai-sdk/svelte';
	import { toast } from 'svelte-sonner';

	import { Button } from '$lib/components/ui/button';
	import type { MessageMetadata } from '$lib/messages';

	interface Props {
		message: UIMessage<MessageMetadata>;
		editing: boolean;
	}

	let { message, editing = $bindable(false) }: Props = $props();

	const initialContent = message.parts.find((part) => part.type === 'text')?.text ?? '';

	let editedContent = $state(initialContent);
	let editTextareaRef = $state<HTMLTextAreaElement | null>(null);
	let isSavingEdit = $state(false);

	function handleEditKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
			event.preventDefault();
			saveEdit();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			editing = false;
		}
	}

	function resizeEditTextarea() {
		if (editTextareaRef) {
			const minHeight = 24;
			editTextareaRef.style.height = 'auto';
			editTextareaRef.style.height = `${Math.max(minHeight, editTextareaRef.scrollHeight)}px`;
			editTextareaRef.style.overflowY = 'hidden';
		}
	}

	async function saveEdit() {
		if (isSavingEdit) return;

		const newContent = editedContent.trim();

		if (newContent === initialContent) {
			editing = false;
			return;
		}

		if (!newContent) {
			toast.error('Please enter a message before saving.');
			return;
		}

		isSavingEdit = true;

		try {
			await fetch(`/api/messages/${message.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					parts: [{ type: 'text', text: newContent }]
				})
			});

			const textPartIndex = message.parts.findIndex((part) => part.type === 'text');
			if (textPartIndex !== -1) {
				(message.parts[textPartIndex] as { type: 'text'; text: string }).text = newContent;
			} else {
				message.parts.push({ type: 'text', text: newContent });
			}
			message.parts = [...message.parts];

			editing = false;
		} catch (error) {
			console.error('Failed to save message edit', { messageId: message.id, cause: error });
			toast.error("We couldn't save your message right now. Please try again.");
		} finally {
			isSavingEdit = false;
		}
	}

	$effect(() => {
		if (editing && editTextareaRef) {
			editTextareaRef.focus();
			editTextareaRef.select();
			resizeEditTextarea();
		}
	});
</script>

<div
	class="bg-secondary border-input focus-within:ring-ring relative w-full rounded-md border p-2 shadow-sm focus-within:ring-1"
	role="form"
	aria-label="Edit message"
>
	<textarea
		rows={1}
		aria-label="Edit message content"
		aria-describedby="edit-help"
		class="text-foreground placeholder:text-muted-foreground block w-full resize-none overflow-y-hidden rounded-md border-0 bg-transparent ring-0 outline-none focus:ring-0"
		onkeydown={handleEditKeyDown}
		oninput={resizeEditTextarea}
		bind:this={editTextareaRef}
		bind:value={editedContent}
	></textarea>
	<div class="mt-2 flex justify-end gap-2">
		<Button
			variant="secondary"
			size="sm"
			aria-label="Cancel editing message"
			onclick={() => (editing = false)}
		>
			Cancel
		</Button>
		<Button
			size="sm"
			aria-label={isSavingEdit ? 'Saving message changes...' : 'Save message changes'}
			onclick={saveEdit}
			disabled={isSavingEdit || editedContent.trim() === initialContent}
		>
			{#if isSavingEdit}
				Saving...
			{:else}
				Save
			{/if}
		</Button>
	</div>
	<div id="edit-help" class="sr-only">
		Press Enter to save, Escape to cancel, or Shift+Enter for new line.
	</div>
</div>
