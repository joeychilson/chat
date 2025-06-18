import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';

import { eq, desc } from 'drizzle-orm';

import db from '$lib/server/db';
import { chatsTable, messagesTable, type NewMessage } from '$lib/server/db/schema';

export const POST: RequestHandler = async ({ locals, params }) => {
	if (!locals.session || !locals.user) {
		error(401, { message: 'You must be signed in to branch a chat.' });
	}

	const userId = locals.user.id;
	const branchedMessageId = params.id;

	try {
		const foundMessage = await db.query.messagesTable.findFirst({
			where: eq(messagesTable.id, branchedMessageId),
			with: { chat: true }
		});

		if (!foundMessage) {
			error(404, { message: "We couldn't find the message you were looking for." });
		}

		if (foundMessage.chat.userId !== userId) {
			error(403, { message: "You don't have permission to branch this message." });
		}

		const originalChatId = foundMessage.chatId;

		const originalMessages = await db.query.messagesTable.findMany({
			where: eq(messagesTable.chatId, originalChatId),
			orderBy: [desc(messagesTable.createdAt)]
		});

		const branchedMessageIndex = originalMessages.findIndex((msg) => msg.id === branchedMessageId);

		if (branchedMessageIndex === -1) {
			console.error('Failed to find branched message in chat history', {
				userId,
				branchedMessageId,
				originalChatId,
				cause: 'Branched message ID not found in original chat history'
			});
			error(500, { message: "We couldn't branch your chat right now. Please try again." });
		}

		const messagesToCopy = originalMessages.slice(branchedMessageIndex).reverse();

		const newChatId = await db.transaction(async (tx) => {
			const [createdChat] = await tx
				.insert(chatsTable)
				.values({
					userId: userId,
					branchedMessageId: branchedMessageId,
					streamId: null,
					title: foundMessage.chat.title
				})
				.returning({ id: chatsTable.id });

			const newMessages: NewMessage[] = messagesToCopy.map((originalMsg) => ({
				chatId: createdChat.id,
				role: originalMsg.role,
				parts: originalMsg.parts,
				metadata: originalMsg.metadata
			}));

			if (newMessages.length > 0) {
				await tx.insert(messagesTable).values(newMessages);
			}

			return createdChat.id;
		});

		return json({ newChatId }, { status: 201 });
	} catch (err) {
		console.error('Failed to branch chat', { userId, branchedMessageId, cause: err });
		error(500, { message: "We couldn't branch your chat right now. Please try again." });
	}
};
