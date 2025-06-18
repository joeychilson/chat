import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { eq, desc } from 'drizzle-orm';

import db from '$lib/server/db';
import { chatsTable } from '$lib/server/db/schema';
import { models } from '$lib/models';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session || !locals.user) {
		redirect(302, '/signin');
	}

	const userId = locals.user.id;

	try {
		const chats = await db.query.chatsTable.findMany({
			where: eq(chatsTable.userId, userId),
			columns: {
				id: true,
				title: true,
				pinned: true,
				lastMessageAt: true,
				lastModelUsed: true,
				branchedMessageId: true
			},
			with: {
				messages: {
					columns: { id: true }
				}
			},
			orderBy: desc(chatsTable.lastMessageAt)
		});

		return {
			chats: chats.map((chat) => ({
				id: chat.id,
				title: chat.title,
				pinned: chat.pinned,
				lastMessageAt: chat.lastMessageAt.toISOString(),
				lastModelUsed: chat.lastModelUsed
					? {
							id: chat.lastModelUsed.id,
							name:
								models.find((m) => m.id === chat.lastModelUsed!.id)?.name || chat.lastModelUsed.id
						}
					: null,
				branchedMessageId: chat.branchedMessageId,
				messageCount: chat.messages.length
			}))
		};
	} catch (err) {
		console.error('Failed to load chats', { userId, cause: err });
		error(500, { message: "We couldn't load your chats right now. Please try again." });
	}
};
