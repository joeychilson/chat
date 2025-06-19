import type { UIDataTypes, UIMessagePart, UIMessage } from 'ai';
import { z } from 'zod';
import type { ModelConfig } from './models';
import type { AllowedFileType } from './files';

export interface Message {
	id: string;
	role: 'user' | 'assistant' | 'system';
	parts: UIMessagePart<
		UIDataTypes,
		Record<string, { input: unknown; output: unknown | undefined }>
	>[];
	metadata?: MessageMetadata;
	branchedChats?: {
		id: string;
		title: string;
	}[];
}

export const messageMetadataSchema = z.object({
	model: z
		.object({
			id: z.string(),
			type: z.string(),
			options: z.record(z.string(), z.any()).optional()
		})
		.optional(),
	duration: z.number().optional(),
	usage: z
		.object({
			inputTokens: z.number().optional(),
			outputTokens: z.number().optional(),
			reasoningTokens: z.number().optional(),
			cachedTokens: z.number().optional(),
			totalTokens: z.number().optional()
		})
		.optional()
		.optional(),
	createdAt: z.number().optional()
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

export function processMessagesForFiles(
	messages: UIMessage[],
	modelConfig: ModelConfig
): UIMessage[] {
	const processedMessages = [...messages];
	const supportedFileTypes = modelConfig.supportedFileTypes || [];
	const filesToMove: UIMessagePart<
		UIDataTypes,
		Record<string, { input: unknown; output: unknown | undefined }>
	>[] = [];

	const isFileSupported = (mediaType: string): boolean => {
		return supportedFileTypes.includes(mediaType as AllowedFileType);
	};

	for (let i = 0; i < processedMessages.length; i++) {
		const message = processedMessages[i];
		if (message.parts) {
			const fileParts = message.parts.filter((part) => part.type === 'file');
			if (fileParts.length > 0) {
				const supportedFileParts = fileParts.filter((part) => isFileSupported(part.mediaType));

				if (message.role === 'assistant') {
					filesToMove.push(...supportedFileParts);
					processedMessages[i] = {
						...message,
						parts: message.parts.filter((part) => part.type !== 'file')
					};
				} else {
					processedMessages[i] = {
						...message,
						parts: [...message.parts.filter((part) => part.type !== 'file'), ...supportedFileParts]
					};
				}
			}
		}
	}

	if (filesToMove.length > 0) {
		for (let i = processedMessages.length - 1; i >= 0; i--) {
			const message = processedMessages[i];
			if (message.role === 'user') {
				processedMessages[i] = {
					...message,
					parts: [...(message.parts || []), ...filesToMove]
				};
				break;
			}
		}
	}

	return processedMessages;
}
