<script lang="ts">
	import Markdown from '$lib/components/markdown';
	import type { Message } from '$lib/messages';

	import MessageActions from './messages-actions.svelte';
	import MessageEditor from './messages-editor.svelte';
	import MessageFiles from './messages-files.svelte';

	interface Props {
		status: 'streaming' | 'submitted' | 'ready' | 'error';
		message: Message;
		retry: (message: Message) => Promise<void>;
		updateMessage: (messageId: string, updatedParts: Message['parts']) => void;
	}

	let { status, message, retry, updateMessage }: Props = $props();

	let editing = $state(false);

	const files = $derived(message.parts.filter((part) => part.type === 'file'));
</script>

<div class="mb-4 flex justify-end">
	<div class={editing ? 'w-full max-w-[60ch]' : 'w-full max-w-[60ch] sm:w-auto'}>
		<div class="group" role="group" aria-label="User message">
			{#if editing}
				<MessageEditor {message} bind:editing />
			{:else}
				<div class="flex flex-col items-end">
					<div
						class="bg-muted overflow-x-auto rounded-md p-2"
						role="article"
						aria-label="User message content"
					>
						{#each message.parts as part, i (`${message.id}-${i}`)}
							{#if part.type === 'text'}
								<Markdown source={part.text} />
							{/if}
						{/each}
					</div>
					<div class="mt-2 flex items-center gap-1" role="toolbar" aria-label="Message actions">
						<MessageActions {status} {message} {retry} {updateMessage} bind:editing />
						{#if files.length > 0}
							<MessageFiles {files} {message} />
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
