<script lang="ts">
	import { page } from '$app/state';

	import IconDotsVertical from '~icons/tabler/dots-vertical';
	import IconPin from '~icons/tabler/pin';
	import IconPinFilled from '~icons/tabler/pin-filled';
	import IconTrash from '~icons/tabler/trash';
	import IconEdit from '~icons/tabler/edit';
	import IconGitBranch from '~icons/tabler/git-branch';

	import { Input } from '$lib/components/ui/input';
	import {
		AlertDialog,
		AlertDialogContent,
		AlertDialogHeader,
		AlertDialogTitle,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogCancel,
		AlertDialogAction
	} from '$lib/components/ui/alert-dialog';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
		DropdownMenuSeparator
	} from '$lib/components/ui/dropdown-menu';
	import {
		SidebarMenuItem,
		SidebarMenuButton,
		SidebarMenuAction
	} from '$lib/components/ui/sidebar';
	import { RecentChats } from '$lib/stores/recent-chats.svelte';

	const recentChats = RecentChats.fromContext();

	interface Props {
		chat: { id: string; title: string; pinned: boolean; branchedMessageId?: string | null };
	}

	const { chat }: Props = $props();

	let inputRef = $state<HTMLInputElement | null>(null);

	let editingChatId = $state<string | null>(null);
	let editedTitle = $state('');

	let showDeleteDialog = $state(false);
	let chatIdToDelete = $state<string>('');

	const handlePin = async () => {
		await recentChats.pin(chat.id);
	};

	const startEditing = (chatId: string, title: string) => {
		editingChatId = chatId;
		editedTitle = title;

		setTimeout(() => {
			if (inputRef) {
				inputRef.focus();
				inputRef.select();
			}
		}, 10);
	};

	const submitTitleUpdate = async () => {
		if (editingChatId && editedTitle.trim() !== '') {
			await recentChats.updateTitle(editingChatId, editedTitle.trim());
		}

		cancelEditing();
	};

	const cancelEditing = () => {
		editingChatId = null;
		editedTitle = '';
	};

	const handleInputKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			submitTitleUpdate();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			cancelEditing();
		}
	};

	const confirmDelete = async () => {
		showDeleteDialog = false;
		await recentChats.delete(chatIdToDelete);
		chatIdToDelete = '';
	};

	const handleDelete = () => {
		chatIdToDelete = chat.id;
		showDeleteDialog = true;
	};
</script>

{#snippet content()}
	<SidebarMenuItem>
		{#if editingChatId === chat.id}
			<Input
				bind:ref={inputRef}
				bind:value={editedTitle}
				onkeydown={handleInputKeyDown}
				onblur={submitTitleUpdate}
				class="h-8 w-full flex-1 rounded-sm bg-transparent px-2 text-sm focus-visible:ring-0"
			/>
		{:else}
			<SidebarMenuButton>
				{#snippet child({ props })}
					<a
						href="/chats/{chat.id}"
						class="overflow-hidden text-sm text-ellipsis whitespace-nowrap"
						class:bg-accent={page.data.currentChat?.id === chat.id}
						ondblclick={(e) => {
							e.preventDefault();
							startEditing(chat.id, chat.title);
						}}
						{...props}
					>
						<div class="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
							{#if chat.branchedMessageId}
								<IconGitBranch class="text-muted-foreground size-3 flex-shrink-0" />
							{/if}
							<span class="truncate">{chat.title}</span>
						</div>
					</a>
				{/snippet}
			</SidebarMenuButton>

			<DropdownMenu>
				<DropdownMenuTrigger>
					{#snippet child({ props })}
						<SidebarMenuAction {...props} aria-label="Chat options menu">
							<IconDotsVertical class="text-muted-foreground size-4" />
						</SidebarMenuAction>
					{/snippet}
				</DropdownMenuTrigger>
				<DropdownMenuContent side="right" align="start" class="w-48">
					<DropdownMenuItem onclick={handlePin}>
						{#if chat.pinned}
							<IconPin class="text-muted-foreground size-4" />
							Unpin chat
						{:else}
							<IconPinFilled class="text-muted-foreground size-4" />
							Pin chat
						{/if}
					</DropdownMenuItem>
					<DropdownMenuItem onclick={() => startEditing(chat.id, chat.title)}>
						<IconEdit class="text-muted-foreground size-4" />
						Rename
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						class="text-destructive focus:bg-destructive/10 focus:text-destructive"
						onclick={handleDelete}
					>
						<IconTrash class="text-destructive size-4" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		{/if}
	</SidebarMenuItem>
{/snippet}

{@render content()}

<AlertDialog bind:open={showDeleteDialog}>
	<AlertDialogContent>
		<AlertDialogHeader>
			<AlertDialogTitle>Delete Chat</AlertDialogTitle>
			<AlertDialogDescription>
				Are you sure you want to delete this chat? This action cannot be undone.
			</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel onclick={() => (showDeleteDialog = false)}>Cancel</AlertDialogCancel>
			<AlertDialogAction onclick={confirmDelete} class="bg-red-500 text-white hover:bg-red-600">
				Delete
			</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
