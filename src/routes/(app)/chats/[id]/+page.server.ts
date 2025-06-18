import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';

import { eq, asc, and } from 'drizzle-orm';

import { defaultModel } from '$lib/models';
import db from '$lib/server/db';
import { chatsTable, messagesTable } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.session || !locals.user) {
		redirect(302, '/signin');
	}

	const userId = locals.user.id;
	const chatId = params.id;

	if (!chatId) {
		error(400, { message: 'A chat ID is required to load your chat.' });
	}

	try {
		const chat = await db.query.chatsTable.findFirst({
			columns: { id: true, userId: true, streamId: true, title: true, lastModelUsed: true },
			where: and(eq(chatsTable.id, chatId), eq(chatsTable.userId, userId)),
			with: {
				messages: {
					columns: { id: true, role: true, parts: true, metadata: true },
					orderBy: asc(messagesTable.createdAt),
					with: {
						branchedChats: {
							columns: { id: true, title: true },
							orderBy: asc(chatsTable.lastMessageAt)
						}
					}
				}
			}
		});

		if (!chat) {
			error(404, { message: "We couldn't find this chat or you don't have access to it." });
		}

		return {
			currentChat: {
				id: chat.id,
				title: chat.title,
				model: chat.lastModelUsed || defaultModel,
				messages: chat.messages,
				resume: chat.streamId ? true : false
			}
		};
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		console.error('Failed to load chat from database', { userId, chatId, cause: err });
		error(500, { message: "We couldn't load your chat right now. Please try again." });
	}
};
