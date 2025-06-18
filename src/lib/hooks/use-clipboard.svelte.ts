import type { UIMessage } from '@ai-sdk/svelte';
import { toast } from 'svelte-sonner';

interface CopiedState {
	id: string;
	timestamp: number;
}

interface ClipboardOptions {
	text: string;
	itemId: string;
	itemType?: string;
}

export function useClipboard() {
	let copiedState = $state<CopiedState | null>(null);

	$effect(() => {
		const currentState = copiedState;
		if (currentState) {
			const timer = setTimeout(() => {
				if (copiedState?.timestamp === currentState.timestamp) {
					copiedState = null;
				}
			}, 2000);

			return () => clearTimeout(timer);
		}
	});

	const performCopy = async (options: ClipboardOptions): Promise<void> => {
		try {
			await navigator.clipboard.writeText(options.text);
			copiedState = { id: options.itemId, timestamp: Date.now() };
		} catch (error: unknown) {
			console.error('Failed to copy to clipboard', {
				itemId: options.itemId,
				itemType: options.itemType || 'data',
				cause: error
			});
			toast.error("We couldn't copy to clipboard right now. Please try again or copy manually.");
			throw error;
		}
	};

	const copyText = async (id: string, text: string): Promise<void> => {
		await performCopy({
			text,
			itemId: id,
			itemType: 'text'
		});
	};

	const copyMessageContent = async (message: UIMessage): Promise<void> => {
		const textPart = message.parts.find((part) => part.type === 'text');

		if (!textPart || !('text' in textPart)) {
			toast.error('No text content found to copy.');
			return;
		}

		await performCopy({
			text: textPart.text,
			itemId: message.id,
			itemType: 'message'
		});
	};

	const isCopied = (id: string): boolean => {
		return copiedState?.id === id;
	};

	return {
		get copiedState() {
			return copiedState;
		},
		isCopied,
		copyText,
		copyMessageContent
	};
}
