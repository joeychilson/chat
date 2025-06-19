<script lang="ts">
	import { goto, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount, tick } from 'svelte';

	import { Chat } from '@ai-sdk/svelte';
	import { DefaultChatTransport } from 'ai';
	import type { User } from 'better-auth';
	import { toast } from 'svelte-sonner';
	import { fade } from 'svelte/transition';

	import IconChevronDown from '~icons/tabler/chevron-down';

	import { AutoScroll } from '$lib/components/auto-scroll';
	import { Button } from '$lib/components/ui/button';
	import { type File } from '$lib/files';
	import { type Message, messageMetadataSchema } from '$lib/messages';
	import { type Model, getModelName } from '$lib/models';
	import { RecentChats } from '$lib/stores/recent-chats.svelte';
	import { RecentFiles } from '$lib/stores/recent-files.svelte';

	import ChatActions from './chat-actions.svelte';
	import ChatInput from './chat-input.svelte';
	import ChatMessages from './messages';

	const recentChats = RecentChats.fromContext();
	const recentFiles = RecentFiles.fromContext();

	interface Props {
		id: string;
		model: Model;
		messages: Message[];
		title?: string;
		prompt?: string;
		resume?: boolean;
		user?: User;
	}

	let { id, model, messages, resume, title, prompt, user }: Props = $props();

	let input = $state('');
	let files = $state<File[]>([]);

	let showScrollButton = $state(false);
	let autoScrollRef = $state<AutoScroll>();

	function modelsAreDifferent(
		messageModel: { id: string; type: string; options?: Record<string, unknown> } | undefined,
		currentModel: Model | undefined
	): boolean {
		if (!messageModel || !currentModel) return false;
		return messageModel.id !== currentModel.id;
	}

	const chat = new Chat({
		id,
		messages,
		messageMetadataSchema: messageMetadataSchema,
		transport: new DefaultChatTransport({
			api: '/api/generate'
		}),
		generateId: () => crypto.randomUUID(),
		onFinish: async ({ message }) => {
			try {
				await recentChats.refetch();
			} catch (error) {
				console.error('Failed to update chat history', { chatId: id, cause: error });
			}
			if (message.metadata?.model?.type == 'image') {
				try {
					await recentFiles.refetch();
				} catch (error) {
					console.error('Failed to update recent files', { chatId: id, cause: error });
				}
			}
		},
		onError: (error) => {
			console.error('Failed to generate chat response', { chatId: id, cause: error });
			toast.error("We couldn't generate a response right now. Please try again.");
		}
	});

	async function submit(event?: Event) {
		event?.preventDefault();

		if (!input.trim() && files.length === 0) {
			return;
		}

		replaceState(`/chats/${id}`, {});

		const fileParts = files.map((file) => ({
			type: 'file' as const,
			mediaType: file.mediaType,
			filename: file.name,
			url: file.url
		}));

		const parts = [];
		if (input.trim()) {
			parts.push({
				type: 'text' as const,
				text: input.trim()
			});
		}
		parts.push(...fileParts);

		input = '';
		files = [];

		await chat.sendMessage(
			{ parts },
			{
				body: {
					model: {
						id: model.id,
						type: model.type,
						options: model.options
					}
				}
			}
		);
	}

	async function retryWithDifferentModel(message: Message) {
		try {
			const response = await fetch(`/api/messages/${message.id}/retry`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					model: {
						id: model.id,
						type: model.type,
						options: model.options
					}
				})
			});

			if (!response.ok) {
				const errorData = await response
					.json()
					.catch(() => ({ message: `HTTP ${response.status}` }));
				throw new Error(errorData.message || `Request failed with status ${response.status}`);
			}

			const { newChatId } = await response.json();

			const modelDisplayName = getModelName(model.id);
			toast.success(`Created new chat with ${modelDisplayName}`);

			await goto(`/chats/${newChatId}?retry=true`, { invalidateAll: true });
		} catch (err: unknown) {
			console.error('Failed to retry with different model', {
				messageId: message.id,
				model,
				cause: err
			});
			toast.error("We couldn't create a new chat right now. Please try again.");
		}
	}

	function updateMessage(messageId: string, updatedParts: Message['parts']) {
		const messageIndex = chat.messages.findIndex((m) => m.id === messageId);
		if (messageIndex !== -1) {
			const updatedMessages = [...chat.messages];
			updatedMessages[messageIndex] = {
				...updatedMessages[messageIndex],
				parts: updatedParts
			};
			chat.messages = updatedMessages;
		}
	}

	async function retry(message: Message) {
		try {
			let messageModel = message.metadata?.model;

			if (message.role === 'user' && !messageModel) {
				const messageIndex = chat.messages.findIndex((m) => m.id === message.id);
				const nextMessage = chat.messages[messageIndex + 1];

				if (nextMessage?.role === 'assistant') {
					messageModel = nextMessage.metadata?.model;
				}
			}

			if (modelsAreDifferent(messageModel, model)) {
				await retryWithDifferentModel(message);
				return;
			}

			const messageIndex = chat.messages.findIndex((m) => m.id === message.id);

			if (messageIndex === -1) {
				throw new Error('Message not found in current history.');
			}

			const sliceEndIndex = message.role === 'user' ? messageIndex + 1 : messageIndex;
			const messagesForReload = chat.messages.slice(0, sliceEndIndex);

			chat.messages = messagesForReload;

			await chat.regenerate({
				body: {
					model: {
						id: model.id,
						type: model.type,
						options: model.options
					},
					retry: message.id
				}
			});
		} catch (err: unknown) {
			console.error('Failed to retry from message', { messageId: message.id, cause: err });
			toast.error("We couldn't retry your message right now. Please try again.");
		}
	}

	function scrollToBottom() {
		autoScrollRef?.scrollToBottomManually();
	}

	function handlePromptSelect(prompt: string, newModel?: Model) {
		input = prompt;

		if (newModel) {
			model = newModel;
		}

		tick().then(() => {
			setTimeout(() => {
				const textarea = document.querySelector('.max-w-3xl textarea');
				if (textarea instanceof HTMLTextAreaElement) {
					textarea.focus();
					textarea.setSelectionRange(textarea.value.length, textarea.value.length);
				}
			}, 50);
		});
	}

	function handleScrollButtonVisibilityChange(visible: boolean) {
		showScrollButton = visible;
	}

	onMount(async () => {
		if (resume) {
			await chat.resumeStream();
		}

		const shouldRetry = page.url.searchParams.get('retry') === 'true';

		if (shouldRetry && chat.messages.length > 0) {
			const lastMessage = chat.messages[chat.messages.length - 1];
			if (lastMessage) {
				const url = new URL(page.url);
				url.searchParams.delete('retry');

				await goto(url.pathname + url.search, { replaceState: true, noScroll: true });

				await retry(lastMessage);
			}
		}

		if (prompt && prompt.trim() && chat.messages.length === 0) {
			await tick();

			replaceState(`/chats/${id}`, {});

			await chat.sendMessage(
				{
					parts: [
						{
							type: 'text' as const,
							text: prompt.trim()
						}
					]
				},
				{
					body: {
						model: {
							id: model.id,
							type: model.type,
							options: model.options
						},
						title: title || undefined
					}
				}
			);
		}
	});
</script>

<div class="relative flex h-full w-full flex-col">
	{#if chat.messages.length === 0 && input.length === 0 && !prompt}
		<div
			class="absolute inset-0 flex items-center justify-center px-4 pb-31"
			in:fade={{ duration: 300 }}
			out:fade={{ duration: 200 }}
		>
			<div class="w-full">
				<div class="mb-8 text-center">
					<h1 class="text-3xl font-medium">
						How can I help you, {user?.name.split(' ')[0] || 'there'}?
					</h1>
				</div>

				<ChatActions onPromptSelect={handlePromptSelect} />
			</div>
		</div>
	{:else}
		<AutoScroll
			bind:this={autoScrollRef}
			items={chat.messages}
			isStreaming={chat.status === 'streaming'}
			onScrollButtonVisibilityChange={handleScrollButtonVisibilityChange}
			class="scrollbar-gutter-stable h-full flex-1 overflow-y-auto pt-16 pb-32"
			role="main"
			aria-label="Chat conversation area"
		>
			<div class="mx-auto w-full max-w-3xl px-4 pb-4 md:px-0">
				<ChatMessages status={chat.status} messages={chat.messages} {retry} {updateMessage} />
			</div>
		</AutoScroll>

		{#if showScrollButton}
			<div
				class="fixed right-0 bottom-36 left-0 z-20 mx-auto w-full max-w-3xl px-4 md:absolute md:px-0"
			>
				<div class="flex justify-center">
					<Button size="sm" onclick={scrollToBottom} aria-label="Scroll to bottom of conversation">
						<IconChevronDown class="size-4" aria-hidden="true" />
						<span>Scroll to bottom</span>
					</Button>
				</div>
			</div>
		{/if}
	{/if}

	<div
		class="fixed right-0 bottom-0 left-0 z-10 mx-auto w-full max-w-3xl px-4 py-6 md:absolute md:px-0"
	>
		<ChatInput status={chat.status} stop={chat.stop} {submit} bind:input bind:model bind:files />
	</div>
</div>
