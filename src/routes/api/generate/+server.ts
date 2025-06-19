import { randomUUID } from 'crypto';

import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';

import {
	type UIMessage,
	convertToModelMessages,
	createUIMessageStream,
	createUIMessageStreamResponse,
	experimental_generateImage,
	experimental_generateSpeech,
	smoothStream,
	streamText
} from 'ai';
import { and, notInArray, eq } from 'drizzle-orm';

import { getExtensionFromMediaType } from '$lib/files';
import { type MessageMetadata, processMessagesForFiles } from '$lib/messages';
import { type Model, models, modelToProviderOptions } from '$lib/models';
import db from '$lib/server/db';
import {
	type Chat,
	chatsTable,
	creationsTable,
	filesTable,
	messagesTable
} from '$lib/server/db/schema';
import {
	generateChatTitle,
	generateImageTitle,
	generateSpeechTitle,
	generateSystemPrompt
} from '$lib/server/generation';
import {
	getImageModelProvider,
	getSpeechModelProvider,
	getTextModelProvider
} from '$lib/server/providers';
import { bucketName, getFileUrl, s3Client } from '$lib/server/files';
import { getStreamContext } from '$lib/server/stream';

async function consumeStream(stream: ReadableStream): Promise<void> {
	const reader = stream.getReader();
	try {
		while (true) {
			const { done } = await reader.read();
			if (done) break;
		}
	} finally {
		reader.releaseLock();
	}
}

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.session || !locals.user) {
		error(401, { message: 'You must be signed in to generate content.' });
	}

	const userId = locals.user.id;
	const startTime = Date.now();

	let id: string;
	let model: Model;
	let messages: UIMessage[];
	let title: string | undefined;
	let retry: string | undefined;

	try {
		const data = await request.json();

		id = data.id;
		model = data.model;
		messages = data.messages;
		title = data.title;
		retry = data.retry;
	} catch (err) {
		console.error('Failed to parse request JSON', { cause: err });
		error(400, { message: "We couldn't process your request. Please try again." });
	}

	console.log('Generation request received', {
		id,
		userId,
		model,
		title,
		retry
	});

	if (!id) {
		error(400, { message: 'Chat ID is required.' });
	}

	if (!model?.id) {
		error(400, { message: 'Model selection is required.' });
	}

	if (!messages || !Array.isArray(messages) || messages.length === 0) {
		error(400, { message: 'At least one message is required.' });
	}

	const baseModel = models.find((m) => m.id === model.id);
	if (!baseModel) {
		error(400, {
			message: 'The selected model is not available. Please choose a different model.'
		});
	}

	const userMessage = messages.filter((message) => message.role === 'user').at(-1);
	if (!userMessage || !userMessage.parts?.some((part) => part.type === 'text' && part.text)) {
		error(400, { message: 'A valid user message is required.' });
	}

	let chat: Chat;
	try {
		const existingChat = await db.query.chatsTable.findFirst({
			where: eq(chatsTable.id, id)
		});

		if (existingChat) {
			chat = existingChat;
		} else {
			const [newChat] = await db
				.insert(chatsTable)
				.values({
					id,
					title: title || 'New Chat',
					userId
				})
				.returning();

			chat = newChat;

			if (!title) {
				generateChatTitle({ message: userMessage })
					.then(({ title }) => {
						db.update(chatsTable)
							.set({ title })
							.where(and(eq(chatsTable.id, id), eq(chatsTable.title, 'New Chat')))
							.catch(console.error);
					})
					.catch(console.error);
			}
		}
	} catch (err) {
		console.error('Failed to access or create chat', { id, userId, cause: err });
		error(500, {
			message: "We couldn't access your chat right now. Please refresh or try again in a moment."
		});
	}

	if (chat.userId !== userId) {
		error(403, { message: "You don't have access to this chat." });
	}

	if (!retry && chat.streamId) {
		error(409, {
			message: 'A generation is already in progress for this chat. Please wait for it to complete.'
		});
	}

	const streamId = randomUUID();

	await db.update(chatsTable).set({ streamId }).where(eq(chatsTable.id, id));

	if (retry) {
		try {
			const messageIdsToKeep = messages.map((msg) => msg.id);

			if (messageIdsToKeep.length > 0) {
				await db
					.delete(messagesTable)
					.where(and(eq(messagesTable.chatId, id), notInArray(messagesTable.id, messageIdsToKeep)));
			} else {
				await db.delete(messagesTable).where(eq(messagesTable.chatId, id));
			}
		} catch (err) {
			console.error('Failed to process chat retry', { id, userId, cause: err });
			error(500, { message: "We couldn't retry your chat. Please try again." });
		}
	} else {
		try {
			await db.transaction(async (tx) => {
				const existingMessage = await tx.query.messagesTable.findFirst({
					where: eq(messagesTable.id, userMessage.id)
				});

				if (!existingMessage) {
					await tx.insert(messagesTable).values({
						id: userMessage.id,
						chatId: id,
						role: 'user',
						parts: userMessage.parts,
						metadata: userMessage.metadata as MessageMetadata
					});
				}
			});
		} catch (err) {
			console.error('Failed to save user message', {
				id,
				userId,
				userMessage,
				cause: err
			});
			error(500, { message: "We couldn't save your message. Please try again." });
		}
	}

	if (baseModel.type === 'text') {
		const providerOptions = modelToProviderOptions(model);
		const { provider, modelId } = getTextModelProvider(model);

		const systemPrompt = generateSystemPrompt(locals.session?.settings);
		const processedMessages = processMessagesForFiles(messages, baseModel);

		const result = streamText({
			model: provider(modelId),
			providerOptions,
			system: systemPrompt,
			messages: convertToModelMessages(processedMessages),
			experimental_transform: smoothStream({ chunking: 'word' })
		});

		result.consumeStream({
			onError: (error) => {
				console.error('Failed to consume stream', {
					id,
					userId,
					model,
					cause: error
				});
			}
		});

		return result.toUIMessageStreamResponse({
			originalMessages: messages,
			sendReasoning: true,
			sendSources: true,
			messageMetadata: ({ part }): MessageMetadata | undefined => {
				if (part.type === 'finish-step') {
					return {
						model: {
							id: model.id,
							type: model.type,
							options: model.options
						},
						duration: Date.now() - startTime
					};
				}

				if (part.type === 'finish') {
					return {
						usage: {
							inputTokens: part.totalUsage.inputTokens,
							outputTokens: part.totalUsage.outputTokens,
							reasoningTokens: part.totalUsage.reasoningTokens,
							cachedTokens: part.totalUsage.cachedInputTokens,
							totalTokens: part.totalUsage.totalTokens
						}
					};
				}
			},
			consumeSseStream: async ({ stream }) => {
				const streamId = randomUUID();

				const streamContext = await getStreamContext();
				const resumableStream = await streamContext.resumableStream(streamId, () => stream);

				if (resumableStream) {
					await db.update(chatsTable).set({ streamId }).where(eq(chatsTable.id, id));

					consumeStream(resumableStream);
				}
			},
			onFinish: async ({ responseMessage }) => {
				try {
					await db.transaction(async (tx) => {
						await tx.insert(messagesTable).values({
							chatId: id,
							role: responseMessage.role,
							parts: responseMessage.parts,
							metadata: responseMessage.metadata as MessageMetadata
						});

						await tx
							.update(chatsTable)
							.set({
								lastModelUsed: model,
								lastMessageAt: new Date(),
								streamId: null
							})
							.where(and(eq(chatsTable.id, id), eq(chatsTable.streamId, streamId)));
					});
				} catch (error) {
					console.error('Failed to save text generation response to database', {
						id,
						userId,
						model,
						error
					});

					db.update(chatsTable)
						.set({ streamId: null })
						.where(and(eq(chatsTable.id, id), eq(chatsTable.streamId, streamId)))
						.catch((clearError) => {
							console.error('Failed to clear streamId after database error', {
								id,
								clearError
							});
						});
				}
			},
			onError: (error) => {
				console.error('Text generation failed', {
					id,
					userId,
					model,
					cause: error
				});

				db.update(chatsTable)
					.set({ streamId: null })
					.where(and(eq(chatsTable.id, id), eq(chatsTable.streamId, streamId)))
					.catch((clearError) => {
						console.error('Failed to clear streamId on error', { id, cause: clearError });
					});

				return 'Sorry, I ran into a problem generating a response. Please try again.';
			}
		});
	} else if (baseModel.type === 'image') {
		const providerOptions = modelToProviderOptions(model);
		const { provider, modelId } = getImageModelProvider(model);

		const prompt = userMessage.parts.find((part) => part.type === 'text')?.text;
		if (!prompt) {
			error(400, { message: 'Please provide a prompt for image generation.' });
		}

		let size: `${number}x${number}` | undefined;
		if (model.options?.size) {
			size = model.options.size as `${number}x${number}`;
		}

		const imageGenerationOptions: Parameters<typeof experimental_generateImage>[0] = {
			model: provider(modelId),
			prompt,
			providerOptions,
			size
		};

		const stream = createUIMessageStream({
			generateId: () => randomUUID(),
			execute: async ({ writer }) => {
				try {
					const messageId = randomUUID();

					writer.write({
						type: 'start',
						messageId
					});

					writer.write({
						type: 'start-step'
					});

					const { image } = await experimental_generateImage(imageGenerationOptions);

					const imageInfo = await generateImageTitle({ imageBase64: image.base64 });

					const uuid = randomUUID();
					const fileExtension = getExtensionFromMediaType(image.mediaType);
					const path = `${userId}/${uuid}${fileExtension}`;
					const imageBuffer = Buffer.from(image.base64, 'base64');

					if (!imageBuffer || imageBuffer.length === 0) {
						throw new Error("Couldn't process the generated image.");
					}

					await s3Client.putObject(bucketName, path, imageBuffer, undefined, {
						'Content-Type': image.mediaType
					});

					const duration = Date.now() - startTime;

					writer.write({
						type: 'file',
						mediaType: image.mediaType,
						url: getFileUrl(path)
					});

					const messageMetadata: MessageMetadata = {
						model: {
							id: model.id,
							type: model.type,
							options: model.options
						},
						duration
					};

					await db.transaction(async (tx) => {
						await tx.insert(messagesTable).values({
							id: messageId,
							chatId: id,
							role: 'assistant',
							parts: [
								{
									type: 'file',
									filename: `${imageInfo.filename}${fileExtension}`,
									mediaType: image.mediaType,
									url: getFileUrl(path)
								}
							],
							metadata: messageMetadata
						});

						const [savedFile] = await tx
							.insert(filesTable)
							.values({
								userId,
								name: `${imageInfo.filename}${fileExtension}`,
								mediaType: image.mediaType,
								size: imageBuffer.length,
								path
							})
							.returning({ id: filesTable.id });

						await tx.insert(creationsTable).values({
							userId,
							fileId: savedFile.id,
							type: 'image',
							title: imageInfo.title,
							metadata: messageMetadata
						});

						await tx
							.update(chatsTable)
							.set({
								lastModelUsed: model,
								lastMessageAt: new Date(),
								streamId: null
							})
							.where(and(eq(chatsTable.id, id), eq(chatsTable.streamId, streamId)));
					});

					writer.write({
						type: 'finish',
						messageMetadata
					});
				} catch (e) {
					console.error('Image generation failed inside stream', { id, userId, cause: e });

					db.update(chatsTable)
						.set({ streamId: null })
						.where(and(eq(chatsTable.id, id), eq(chatsTable.streamId, streamId)))
						.catch((clearError) => {
							console.error('Failed to clear streamId after image generation error', {
								id,
								clearError
							});
						});
				}
			},
			onError: (error) => {
				console.error('Failed to stream image', { id, userId, cause: error });

				db.update(chatsTable)
					.set({ streamId: null })
					.where(and(eq(chatsTable.id, id), eq(chatsTable.streamId, streamId)))
					.catch((clearError) => {
						console.error('Failed to clear streamId on error', { id, cause: clearError });
					});

				return 'Sorry, I ran into a problem streaming your image. Please try again.';
			}
		});

		return createUIMessageStreamResponse({
			stream,
			consumeSseStream: async ({ stream }) => {
				const streamId = randomUUID();

				const streamContext = await getStreamContext();
				const resumableStream = await streamContext.resumableStream(streamId, () => stream);

				if (resumableStream) {
					await db.update(chatsTable).set({ streamId }).where(eq(chatsTable.id, id));

					consumeStream(resumableStream);
				}
			}
		});
	} else if (baseModel.type === 'speech') {
		const providerOptions = modelToProviderOptions(model);
		const { provider, modelId } = getSpeechModelProvider(model);

		const prompt = userMessage.parts.find((part) => part.type === 'text')?.text;
		if (!prompt) {
			error(400, { message: 'Please provide text for speech generation.' });
		}

		let voice: string | undefined;
		let speed: number | undefined;

		if (model.options?.voice) {
			voice = model.options.voice as string;
		}

		if (model.options?.speed) {
			speed = parseFloat(model.options.speed as string);
		}

		const speechGenerationOptions: Parameters<typeof experimental_generateSpeech>[0] = {
			model: provider(modelId),
			text: prompt,
			voice,
			speed,
			providerOptions
		};

		const stream = createUIMessageStream({
			generateId: () => randomUUID(),
			execute: async ({ writer }) => {
				try {
					const messageId = randomUUID();

					writer.write({
						type: 'start',
						messageId
					});

					writer.write({
						type: 'start-step'
					});

					const { audio } = await experimental_generateSpeech(speechGenerationOptions);

					const speechInfo = await generateSpeechTitle({ text: prompt });

					const uuid = randomUUID();
					const fileExtension = '.mp3';
					const path = `${userId}/${uuid}${fileExtension}`;
					const audioBuffer = Buffer.from(audio.base64, 'base64');

					if (!audioBuffer || audioBuffer.length === 0) {
						throw new Error("Couldn't process the generated audio.");
					}

					await s3Client.putObject(bucketName, path, audioBuffer, undefined, {
						'Content-Type': 'audio/mpeg'
					});

					const duration = Date.now() - startTime;

					writer.write({
						type: 'file',
						mediaType: 'audio/mpeg',
						url: getFileUrl(path)
					});

					const messageMetadata: MessageMetadata = {
						model: {
							id: model.id,
							type: model.type,
							options: model.options
						},
						duration
					};

					await db.transaction(async (tx) => {
						await tx.insert(messagesTable).values({
							id: messageId,
							chatId: id,
							role: 'assistant',
							parts: [
								{
									type: 'file',
									filename: `${speechInfo.filename}${fileExtension}`,
									mediaType: 'audio/mpeg',
									url: getFileUrl(path)
								}
							],
							metadata: messageMetadata
						});

						const [savedFile] = await tx
							.insert(filesTable)
							.values({
								userId,
								name: `${speechInfo.filename}${fileExtension}`,
								mediaType: 'audio/mpeg',
								size: audioBuffer.length,
								path
							})
							.returning({ id: filesTable.id });

						await tx.insert(creationsTable).values({
							userId,
							fileId: savedFile.id,
							type: 'audio',
							title: speechInfo.title,
							metadata: messageMetadata
						});

						await tx
							.update(chatsTable)
							.set({
								lastModelUsed: model,
								lastMessageAt: new Date(),
								streamId: null
							})
							.where(and(eq(chatsTable.id, id), eq(chatsTable.streamId, streamId)));
					});

					writer.write({
						type: 'finish',
						messageMetadata
					});
				} catch (e) {
					console.error('Speech generation failed inside stream', { id, userId, cause: e });

					db.update(chatsTable)
						.set({ streamId: null })
						.where(and(eq(chatsTable.id, id), eq(chatsTable.streamId, streamId)))
						.catch((clearError) => {
							console.error('Failed to clear streamId after speech generation error', {
								id,
								clearError
							});
						});
				}
			},
			onError: (error) => {
				console.error('Failed to stream audio', { id, userId, cause: error });

				db.update(chatsTable)
					.set({ streamId: null })
					.where(and(eq(chatsTable.id, id), eq(chatsTable.streamId, streamId)))
					.catch((clearError) => {
						console.error('Failed to clear streamId on error', { id, cause: clearError });
					});

				return 'Sorry, I ran into a problem streaming your audio. Please try again.';
			}
		});

		return createUIMessageStreamResponse({
			stream,
			consumeSseStream: async ({ stream }) => {
				const streamId = randomUUID();

				const streamContext = await getStreamContext();
				const resumableStream = await streamContext.resumableStream(streamId, () => stream);

				if (resumableStream) {
					await db.update(chatsTable).set({ streamId }).where(eq(chatsTable.id, id));

					consumeStream(resumableStream);
				}
			}
		});
	}

	error(400, {
		message: 'The selected model type is not supported. Please choose a different model.'
	});
};
