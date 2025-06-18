<script lang="ts">
	import { goto } from '$app/navigation';

	import type { UIMessage } from 'ai';
	import { toast } from 'svelte-sonner';

	import IconCheck from '~icons/tabler/check';
	import IconCopy from '~icons/tabler/copy';
	import IconDownload from '~icons/tabler/download';
	import IconEdit from '~icons/tabler/edit';
	import IconGitFork from '~icons/tabler/git-fork';
	import IconRefresh from '~icons/tabler/refresh';
	import IconSpeakerphone from '~icons/tabler/speakerphone';

	import { Button } from '$lib/components/ui/button';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
		DropdownMenuSeparator
	} from '$lib/components/ui/dropdown-menu';
	import { useClipboard } from '$lib/hooks/use-clipboard.svelte';
	import { useDownload } from '$lib/hooks/use-download.svelte';
	import { RecentChats } from '$lib/stores/recent-chats.svelte';
	import type { Message } from '$lib/messages';

	const recentChats = RecentChats.fromContext();

	const { copyMessageContent, copyText, isCopied } = useClipboard();
	const { downloadAsMarkdown, downloadAttachedFile, isDownloaded } = useDownload();

	interface Props {
		status: 'streaming' | 'submitted' | 'ready' | 'error';
		message: Message;
		retry: (message: Message) => Promise<void>;
		updateMessage: (messageId: string, updatedParts: Message['parts']) => void;
		editing: boolean;
	}

	let { status, message, retry, updateMessage, editing = $bindable(false) }: Props = $props();

	let generatingSpeech = $state(false);
	let branching = $state(false);

	async function handleBranching(message: UIMessage) {
		if (branching) return;
		branching = true;

		try {
			const response = await fetch(`/api/messages/${message.id}/branch`, {
				method: 'POST'
			});

			if (!response.ok) {
				const errorData = await response
					.json()
					.catch(() => ({ message: `HTTP ${response.status}` }));
				throw new Error(errorData.message || `Request failed with status ${response.status}`);
			}

			const { newChatId } = await response.json();

			await recentChats.refetch();
			await goto(`/chats/${newChatId}`);

			toast.success('Chat branched successfully!');
		} catch (err) {
			console.error('Failed to branch chat', { messageId: message.id, cause: err });
			toast.error("We couldn't branch your chat right now. Please try again.");
		} finally {
			branching = false;
		}
	}

	async function handleSpeechGeneration(message: Message) {
		if (generatingSpeech) return;
		generatingSpeech = true;

		try {
			const response = await fetch(`/api/messages/${message.id}/speech`, {
				method: 'POST'
			});

			if (!response.ok) {
				const errorData = await response
					.json()
					.catch(() => ({ message: `HTTP ${response.status}` }));
				throw new Error(errorData.message || `Request failed with status ${response.status}`);
			}

			const result = await response.json();
			toast.success('Speech generated successfully!');

			if (result.message?.parts) {
				updateMessage(message.id, result.message.parts);
			}
		} catch (err) {
			console.error('Failed to generate speech', { messageId: message.id, cause: err });
			toast.error("Couldn't generate speech right now. Please try again.");
		} finally {
			generatingSpeech = false;
		}
	}
</script>

<div class="flex items-center gap-1" class:flex-row-reverse={message.role === 'user'}>
	{#if message.parts.some((part) => part.type === 'text')}
		<Button
			variant="ghost"
			size="sm"
			aria-label={isCopied(message.id) ? 'Message copied' : 'Copy message content'}
			onclick={async () => {
				await copyMessageContent(message);
			}}
		>
			{#if isCopied(message.id)}
				<IconCheck class="size-4 text-green-500" />
			{:else}
				<IconCopy class="text-muted-foreground size-4" />
			{/if}
		</Button>
	{/if}
	{#if message.parts.some((part) => part.type === 'file' && !part.mediaType.startsWith('audio/')) && message.role === 'assistant'}
		<Button
			variant="ghost"
			size="sm"
			aria-label={isCopied(message.id) ? 'File URL copied' : 'Copy file URL'}
			onclick={async () => {
				await copyText(message.id, message.parts.find((part) => part.type === 'file')?.url ?? '');
			}}
		>
			{#if isCopied(message.id)}
				<IconCheck class="size-4 text-green-500" />
			{:else}
				<IconCopy class="text-muted-foreground size-4" />
			{/if}
		</Button>
	{/if}
	{#if message.parts.some((part) => part.type === 'file' && !part.mediaType.startsWith('audio/')) && message.role === 'assistant'}
		<Button
			variant="ghost"
			size="sm"
			aria-label={isDownloaded(message.id) ? 'File downloaded' : 'Download attached file'}
			onclick={async () => {
				await downloadAttachedFile(message);
			}}
		>
			{#if isDownloaded(message.id)}
				<IconCheck class="size-4 text-green-500" />
			{:else}
				<IconDownload class="text-muted-foreground size-4" />
			{/if}
		</Button>
	{/if}
	{#if message.parts.some((part) => part.type === 'text')}
		<Button
			variant="ghost"
			size="sm"
			aria-label={isDownloaded(message.id) ? 'Markdown downloaded' : 'Download as markdown'}
			onclick={async () => {
				await downloadAsMarkdown(message);
			}}
		>
			{#if isDownloaded(message.id)}
				<IconCheck class="size-4 text-green-500" />
			{:else}
				<IconDownload class="text-muted-foreground size-4" />
			{/if}
		</Button>
	{/if}
	{#if message.parts.some((part) => part.type === 'text')}
		<Button
			variant="ghost"
			size="sm"
			aria-label="Edit message"
			disabled={status === 'streaming' || status === 'submitted'}
			onclick={() => (editing = true)}
		>
			<IconEdit class="text-muted-foreground size-4" />
		</Button>
	{/if}
	<Button
		variant="ghost"
		size="sm"
		aria-label="Retry generating response"
		disabled={status === 'streaming' || status === 'submitted'}
		onclick={() => retry(message)}
	>
		<IconRefresh class="text-muted-foreground size-4" />
	</Button>
	<DropdownMenu>
		<DropdownMenuTrigger>
			{#snippet child({ props })}
				<Button
					variant="ghost"
					size="sm"
					aria-label={branching
						? 'Branching conversation...'
						: 'Branch conversation from this message'}
					disabled={branching}
					{...props}
				>
					{#if branching}
						<IconGitFork class="size-4 animate-pulse text-blue-500" />
					{:else}
						<IconGitFork class="text-muted-foreground size-4" />
					{/if}
					{#if message.branchedChats && message.branchedChats.length > 0}
						<span
							class="text-muted-foreground ml-1 text-xs"
							aria-label="{message.branchedChats.length} existing branches"
						>
							{message.branchedChats.length}
						</span>
					{/if}
				</Button>
			{/snippet}
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end">
			<DropdownMenuItem onclick={() => handleBranching(message)}>
				<IconGitFork class="size-4" />
				<span>Branch from here</span>
			</DropdownMenuItem>
			{#if message.branchedChats && message.branchedChats.length > 0}
				<DropdownMenuSeparator />
				{#each message.branchedChats as chat (chat.id)}
					<DropdownMenuItem>
						<a href={`/chats/${chat.id}`} class="flex w-full items-center gap-2 text-sm">
							<IconGitFork class="text-muted-foreground size-4" />
							<span class="max-w-48 truncate" title={chat.title}>
								{chat.title}
							</span>
						</a>
					</DropdownMenuItem>
				{/each}
			{/if}
		</DropdownMenuContent>
	</DropdownMenu>
	{#if message.role === 'assistant' && message.parts.some((part) => part.type === 'text') && !message.parts.some((part) => part.type === 'file' && part.mediaType.startsWith('audio/'))}
		<Button
			variant="ghost"
			size="sm"
			aria-label={generatingSpeech ? 'Generating speech...' : 'Generate speech from text'}
			disabled={status === 'streaming' || status === 'submitted' || generatingSpeech}
			onclick={() => handleSpeechGeneration(message)}
		>
			{#if generatingSpeech}
				<IconSpeakerphone class="size-4 animate-pulse text-green-500" />
			{:else}
				<IconSpeakerphone class="text-muted-foreground size-4" />
			{/if}
		</Button>
	{/if}
</div>
