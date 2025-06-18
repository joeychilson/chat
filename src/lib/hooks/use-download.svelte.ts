import { toast } from 'svelte-sonner';
import type { UIDataTypes, UIMessagePart } from 'ai';

import { getExtensionFromMediaType } from '$lib/files';
import type { Message } from '$lib/messages';

interface DownloadState {
	messageId: string;
	timestamp: number;
}

interface DownloadOptions {
	content: string | Blob;
	filename: string;
	mimeType?: string;
	itemId?: string;
}

export function useDownload() {
	let downloadState = $state<DownloadState | null>(null);

	const isDownloaded = (messageId: string): boolean => {
		return downloadState?.messageId === messageId;
	};

	const resetDownloaded = (): void => {
		downloadState = null;
	};

	const performDownload = async (options: DownloadOptions): Promise<void> => {
		try {
			const blob =
				options.content instanceof Blob
					? options.content
					: new Blob([options.content], { type: options.mimeType || 'text/plain' });

			const url = URL.createObjectURL(blob);
			const anchor = document.createElement('a');

			anchor.href = url;
			anchor.download = options.filename;

			document.body.appendChild(anchor);
			anchor.click();

			document.body.removeChild(anchor);
			URL.revokeObjectURL(url);

			if (options.itemId) {
				downloadState = { messageId: options.itemId, timestamp: Date.now() };
			}
		} catch (error: unknown) {
			console.error('Download failed', {
				filename: options.filename,
				itemId: options.itemId,
				cause: error
			});
			toast.error("We couldn't download your file right now. Please try again.");
			throw error;
		}
	};

	const downloadAsMarkdown = async (message: Message): Promise<void> => {
		const textPart = message.parts.find((part) => part.type === 'text');

		if (!textPart || !('text' in textPart)) {
			toast.error('No text content found to download.');
			return;
		}

		await performDownload({
			content: textPart.text,
			filename: `${message.id}.md`,
			mimeType: 'text/markdown',
			itemId: message.id
		});
	};

	const downloadAttachedFile = async (message: Message): Promise<void> => {
		const filePart = message.parts.find((part) => part.type === 'file');

		if (!filePart || !('url' in filePart) || !filePart.url) {
			toast.error('No file attachment found to download.');
			return;
		}

		try {
			const response = await fetch(filePart.url);
			if (!response.ok) {
				throw new Error(`Failed to fetch file: ${response.statusText}`);
			}

			const blob = await response.blob();
			const filename = generateFilename(filePart.url, message.id, filePart);

			await performDownload({
				content: blob,
				filename,
				itemId: message.id
			});
		} catch (error: unknown) {
			console.error('Failed to fetch file for download', {
				messageId: message.id,
				url: filePart.url,
				cause: error
			});
			toast.error("We couldn't download your file right now. Please try again.");
		}
	};

	const downloadCustomMarkdown = async (
		content: string,
		filename: string,
		itemId?: string
	): Promise<void> => {
		await performDownload({
			content,
			filename: filename.endsWith('.md') ? filename : `${filename}.md`,
			mimeType: 'text/markdown',
			itemId
		});
	};

	const generateFilename = (
		url: string,
		fallbackId: string,
		filePart: UIMessagePart<
			UIDataTypes,
			Record<string, { input: unknown; output: unknown | undefined }>
		>
	): string => {
		const urlPath = new URL(url).pathname;
		const filename = urlPath.split('/').pop() || fallbackId;

		if (!filename.includes('.') && 'mediaType' in filePart && filePart.mediaType) {
			const extension = getExtensionFromMediaType(filePart.mediaType);
			return `${filename}${extension}`;
		}

		return filename;
	};

	return {
		get downloadState() {
			return downloadState;
		},
		isDownloaded,
		resetDownloaded,
		downloadAsMarkdown,
		downloadAttachedFile,
		downloadCustomMarkdown
	};
}
