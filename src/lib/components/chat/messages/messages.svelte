<script lang="ts">
	import { type Message } from '$lib/messages';

	import MessageUser from './messages-user.svelte';
	import MessageAssistant from './messages-assistant.svelte';

	interface Props {
		status: 'streaming' | 'submitted' | 'ready' | 'error';
		messages: Message[];
		retry: (message: Message) => Promise<void>;
		updateMessage: (messageId: string, updatedParts: Message['parts']) => void;
	}

	let { status, messages, retry, updateMessage }: Props = $props();
</script>

<div
	class="group relative w-full max-w-full break-words"
	role="log"
	aria-label="Chat conversation"
	aria-live="polite"
>
	{#each messages as message, i (message.id)}
		{@const lastMessage = i === messages.length - 1}

		{#if message.role === 'user'}
			<MessageUser {status} {message} {retry} {updateMessage} />
		{:else if message.role === 'assistant'}
			<MessageAssistant {status} {message} {lastMessage} {retry} {updateMessage} />
		{/if}
	{/each}
</div>
