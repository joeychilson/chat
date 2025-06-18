import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';

import { eq, asc } from 'drizzle-orm';

import db from '$lib/server/db';
import { chatsTable, messagesTable, type NewMessage } from '$lib/server/db/schema';
import type { Model } from '$lib/models';
import { getModelName } from '$lib/models';

export const POST: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.session || !locals.user) {
		error(401, { message: 'You must be signed in to retry.' });
	}

	const userId = locals.user.id;
	const retryMessageId = params.id;

	let requestBody;
	try {
		requestBody = await request.json();
	} catch {
		error(400, { message: 'Invalid request body.' });
	}

	const { model }: { model: Model } = requestBody;

	if (!model || !model.id || !model.type) {
		error(400, { message: 'A valid model is required.' });
	}

	try {
		const foundMessage = await db.query.messagesTable.findFirst({
			where: eq(messagesTable.id, retryMessageId),
			with: { chat: true }
		});

		if (!foundMessage) {
			error(404, { message: "We couldn't find the message you were looking for." });
		}

		if (foundMessage.chat.userId !== userId) {
			error(403, { message: "You don't have permission to retry this message." });
		}

		const originalChatId = foundMessage.chatId;

		const originalMessages = await db.query.messagesTable.findMany({
			where: eq(messagesTable.chatId, originalChatId),
			orderBy: [asc(messagesTable.createdAt)]
		});

		const retryMessageIndex = originalMessages.findIndex((msg) => msg.id === retryMessageId);

		if (retryMessageIndex === -1) {
			console.error('Failed to find retry message in chat history', {
				userId,
				retryMessageId,
				originalChatId,
				cause: 'Retry message ID not found in original chat history'
			});
			error(500, { message: "We couldn't retry your chat right now. Please try again." });
		}

		const retryMessage = originalMessages[retryMessageIndex];
		let messagesToCopy;

		if (retryMessage.role === 'user') {
			messagesToCopy = originalMessages.slice(0, retryMessageIndex + 1);
		} else {
			messagesToCopy = originalMessages.slice(0, retryMessageIndex);
		}

		const newChatId = await db.transaction(async (tx) => {
			const modelDisplayName = getModelName(model.id);
			const newChatTitle = `${foundMessage.chat.title} with ${modelDisplayName}`;
			const [createdChat] = await tx
				.insert(chatsTable)
				.values({
					userId: userId,
					branchedMessageId: retryMessageId,
					streamId: null,
					title: newChatTitle,
					lastModelUsed: model
				})
				.returning({ id: chatsTable.id });

			if (messagesToCopy.length > 0) {
				const newMessages: NewMessage[] = messagesToCopy.map((originalMsg) => ({
					chatId: createdChat.id,
					role: originalMsg.role,
					parts: originalMsg.parts,
					metadata: originalMsg.metadata
				}));

				await tx.insert(messagesTable).values(newMessages);
			}

			return createdChat.id;
		});

		return json({ newChatId }, { status: 201 });
	} catch (err) {
		console.error('Failed to retry with different model', {
			userId,
			retryMessageId,
			model,
			cause: err
		});
		error(500, { message: "We couldn't retry your chat right now. Please try again." });
	}
};
