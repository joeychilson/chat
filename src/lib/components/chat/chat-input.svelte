<script lang="ts">
	import type { ChatRequestOptions } from 'ai';
	import { toast } from 'svelte-sonner';

	import IconStop from '~icons/tabler/player-stop';
	import IconSend from '~icons/tabler/send';

	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import type { File } from '$lib/files';
	import type { Model } from '$lib/models';

	import ChatFiles from './files';
	import ChatModel from './model';

	interface Props {
		status: 'streaming' | 'submitted' | 'ready' | 'error';
		submit: (event?: Event, options?: ChatRequestOptions) => Promise<void>;
		stop: () => void;
		input: string;
		model: Model;
		files: File[];
	}

	let {
		status,
		submit,
		stop,
		input = $bindable(''),
		model = $bindable(),
		files = $bindable()
	}: Props = $props();

	let uploading = $state(false);
</script>

<div class="bg-card border-input rounded-md border">
	<Textarea
		rows={1}
		placeholder={model.type === 'image' ? 'Describe your image...' : 'Ask anything...'}
		aria-label={model.type === 'image'
			? 'Describe the image you want to generate'
			: 'Type your message'}
		aria-describedby="chat-input-help"
		class="bg-card max-h-58 w-full resize-none overflow-y-auto border-none shadow-none focus-visible:ring-0"
		onkeydown={(event) => {
			if (event.key === 'Enter' && event.metaKey && !event.isComposing) {
				event.preventDefault();

				if (status === 'submitted') {
					toast.warning('Please wait for the model to finish before sending another message.');
				} else {
					submit(event);
				}
			}

			if (event.key === 'Escape' && event.metaKey && status === 'streaming') {
				event.preventDefault();
				stop();
			}
		}}
		bind:value={input}
	/>

	<div class="flex justify-between p-2">
		<div class="flex items-center gap-2">
			<ChatFiles {status} {model} bind:uploading bind:files />
		</div>
		<div class="flex items-center gap-2">
			<ChatModel bind:model />
			{#if status === 'streaming' || status === 'submitted'}
				<Button
					variant="destructive"
					size="icon"
					class="animate-pulse"
					aria-label="Stop generating response"
					onclick={(event) => {
						event.preventDefault();
						stop();
					}}
				>
					<IconStop class="size-4" />
				</Button>
			{:else}
				<Button
					size="icon"
					aria-label={input.trim() ? 'Send message' : 'Send message (message required)'}
					disabled={!input.trim()}
					onclick={(event) => {
						event.preventDefault();
						submit(event);
					}}
				>
					{#if input.trim() === ''}
						<IconSend class="text-muted-foreground size-4" />
					{:else}
						<IconSend class="size-4" />
					{/if}
				</Button>
			{/if}
		</div>
	</div>
	<div id="chat-input-help" class="sr-only">
		Press Cmd+Enter to send your message, or Cmd+Escape to stop generation.
	</div>
</div>
