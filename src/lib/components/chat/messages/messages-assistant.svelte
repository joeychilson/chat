<script lang="ts">
	import IconDots from '~icons/tabler/dots';

	import AudioPlayer from '$lib/components/audio-player';
	import Markdown from '$lib/components/markdown';
	import type { Message } from '$lib/messages';

	import MessageActions from './messages-actions.svelte';
	import MessageEditor from './messages-editor.svelte';
	import MessageMetadata from './messages-metadata.svelte';
	import MessageModel from './messages-model.svelte';
	import MessageReasoning from './messages-reasoning.svelte';
	import MessageSources from './messages-sources.svelte';

	interface Props {
		status: 'streaming' | 'submitted' | 'ready' | 'error';
		message: Message;
		retry: (message: Message) => Promise<void>;
		updateMessage: (messageId: string, updatedParts: Message['parts']) => void;
		lastMessage?: boolean;
	}

	let { status, message, retry, updateMessage, lastMessage = false }: Props = $props();

	let editing = $state(false);
</script>

<div class="mb-4 flex justify-start">
	<div class="w-full max-w-3xl">
		<div class="group">
			<div class="overflow-x-auto">
				{#if editing}
					<MessageEditor {message} bind:editing />
				{:else}
					{#each message.parts as part, i (`${message.id}-${i}`)}
						{#if part.type === 'reasoning'}
							<MessageReasoning
								text={part.text}
								isLoading={status === 'streaming' && lastMessage}
							/>
						{:else if part.type === 'text'}
							<div class="max-w-none text-left">
								<Markdown source={part.text} />
							</div>
						{:else if part.type === 'file'}
							<div class="max-w-none text-left">
								{#if part.mediaType.startsWith('image/')}
									<div class="group/image relative">
										<img
											alt=""
											src={part.url}
											class="max-h-96 w-auto max-w-full rounded-md border object-contain sm:h-96"
										/>
									</div>
								{:else if part.mediaType.startsWith('audio/')}
									<AudioPlayer file={part} {message} />
								{/if}
							</div>
						{/if}
					{/each}
				{/if}
			</div>
			<MessageSources parts={message.parts.filter((part) => part.type === 'source-url')} />
			<div class="mt-2 flex items-center justify-between">
				<div class="flex items-center gap-1">
					{#if status === 'streaming' && lastMessage}
						<div aria-live="polite" aria-label="AI is generating response">
							<IconDots class="size-5 animate-pulse" />
						</div>
					{:else if message.parts.length > 0}
						<MessageActions {status} {message} {retry} {updateMessage} bind:editing />
					{/if}
				</div>
				<div class="flex items-center gap-1">
					{#if message.metadata}
						{#if message.metadata.model && message.metadata.duration}
							<div class="text-muted-foreground flex items-center gap-1 text-xs">
								<MessageModel {message} />
							</div>
						{/if}
						<MessageMetadata {message} />
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
