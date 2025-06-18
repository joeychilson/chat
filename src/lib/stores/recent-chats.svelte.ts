import { goto } from '$app/navigation';
import { page } from '$app/state';
import { getContext, setContext } from 'svelte';

import { toast } from 'svelte-sonner';

const contextKey = Symbol('chats');

type Chat = {
	id: string;
	title: string;
	pinned: boolean;
	lastMessageAt: string;
	branchedMessageId?: string | null;
};

type GroupedChats = {
	today: Chat[];
	yesterday: Chat[];
	last7Days: Chat[];
	last30Days: Chat[];
	older: Chat[];
};

export class RecentChats {
	chats = $state<Chat[]>([]);
	pinned = $derived(this.chats.filter((chat) => chat.pinned));
	unpinned = $derived(this.chats.filter((chat) => !chat.pinned));

	groupedUnpinned = $derived.by(() => {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
		const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
		const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

		const groups: GroupedChats = {
			today: [],
			yesterday: [],
			last7Days: [],
			last30Days: [],
			older: []
		};

		for (const chat of this.unpinned) {
			const messageDate = new Date(chat.lastMessageAt);

			if (messageDate >= today) {
				groups.today.push(chat);
			} else if (messageDate >= yesterday) {
				groups.yesterday.push(chat);
			} else if (messageDate >= last7Days) {
				groups.last7Days.push(chat);
			} else if (messageDate >= last30Days) {
				groups.last30Days.push(chat);
			} else {
				groups.older.push(chat);
			}
		}

		return groups;
	});

	constructor(chats: Chat[]) {
		this.chats = chats;
	}

	get = (chatId: string): Chat | undefined => this.chats.find((c) => c.id === chatId);

	async refetch() {
		const errorMessage =
			"We couldn't load your chats right now. Please refresh or try again in a moment.";

		try {
			const res = await fetch('/api/chats?limit=50');
			if (res.ok) {
				const data: { chats: Chat[] } = await res.json();
				this.chats = data.chats;
			} else {
				console.error('Failed to fetch chats', { status: res.status });
				toast.error(errorMessage);
			}
		} catch (err) {
			console.error('Failed to fetch chats', { cause: err });
			toast.error(errorMessage);
		}
	}

	async pin(chatId: string) {
		const chatIndex = this.chats.findIndex((c) => c.id === chatId);
		if (chatIndex === -1) {
			return;
		}

		const chat = this.chats[chatIndex];
		const originalPinned = chat.pinned;
		const newPinned = !originalPinned;

		chat.pinned = newPinned;

		try {
			const response = await fetch(`/api/chats/${chatId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ pinned: newPinned })
			});

			if (!response.ok) {
				throw new Error(`Failed to ${newPinned ? 'pin' : 'unpin'} chat: ${response.status}`);
			}

			toast.success(`Chat ${newPinned ? 'pinned' : 'unpinned'} successfully`);
		} catch (error) {
			console.error(`Failed to ${newPinned ? 'pin' : 'unpin'} chat`, { chatId, cause: error });
			toast.error(
				`We couldn't ${newPinned ? 'pin' : 'unpin'} your chat right now. Please try again.`
			);

			chat.pinned = originalPinned;
		}
	}

	async updateTitle(chatId: string, newTitle: string): Promise<void> {
		const chatIndex = this.chats.findIndex((c) => c.id === chatId);
		if (chatIndex === -1) {
			return;
		}

		const currentChat = this.chats[chatIndex];
		const originalTitle = currentChat.title;

		if (originalTitle === newTitle) {
			return;
		}

		currentChat.title = newTitle;

		try {
			const response = await fetch(`/api/chats/${chatId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ title: newTitle })
			});

			if (!response.ok) {
				throw new Error(`Failed to update chat title: ${response.status}`);
			}

			toast.success('Chat title updated successfully');
		} catch (error) {
			console.error('Failed to update chat title', { chatId, cause: error });
			toast.error("We couldn't update your chat title right now. Please try again.");
			currentChat.title = originalTitle;
		}
	}

	async delete(chatId: string): Promise<void> {
		const currentChatId = page.data?.currentChat?.id ?? page.params.id;
		const originalChats = [...this.chats];
		this.chats = this.chats.filter((chat) => chat.id !== chatId);

		try {
			const resp = await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });

			if (resp.ok) {
				toast.success('Chat deleted successfully.');

				await this.refetch();

				if (chatId === currentChatId) {
					await goto('/', { invalidateAll: true });
				}
			} else {
				this.chats = originalChats;
				const errorData = await resp.json().catch(() => ({ message: resp.statusText }));
				toast.error(
					errorData.message || "We couldn't delete your chat right now. Please try again."
				);
			}
		} catch (error) {
			this.chats = originalChats;
			console.error('Failed to delete chat', { chatId, cause: error });
			toast.error("We couldn't delete your chat right now. Please try again.");
		}
	}

	setContext() {
		setContext(contextKey, this);
	}

	static fromContext(): RecentChats {
		return getContext(contextKey);
	}
}
