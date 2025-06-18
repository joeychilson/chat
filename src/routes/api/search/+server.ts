import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';

import { eq, desc } from 'drizzle-orm';

import db from '$lib/server/db';
import { chatsTable, messagesTable } from '$lib/server/db/schema';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.session || !locals.user) {
		error(401, { message: 'You must be signed in to search your chats.' });
	}

	const userId = locals.user.id;
	const queryParam = url.searchParams.get('q');
	const limitParam = url.searchParams.get('limit');

	if (!queryParam || queryParam.trim().length === 0) {
		return json({ chats: [] });
	}

	const query = queryParam.trim();
	const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : 20;

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
					columns: { id: true, parts: true, role: true },
					limit: 3,
					orderBy: desc(messagesTable.createdAt)
				}
			},
			orderBy: desc(chatsTable.lastMessageAt),
			limit: limit * 2
		});

		const filteredChats = chats
			.filter((chat) => {
				if (chat.title.toLowerCase().includes(query.toLowerCase())) {
					return true;
				}

				return chat.messages.some((message) => {
					if (message.parts && Array.isArray(message.parts)) {
						return message.parts.some((part) => {
							if (typeof part === 'object' && part !== null && 'text' in part) {
								return (part.text as string).toLowerCase().includes(query.toLowerCase());
							}
							return false;
						});
					}
					return false;
				});
			})
			.slice(0, limit);

		const searchResults = filteredChats.map((chat) => {
			let snippet = '';
			chat.messages.find((message) => {
				if (message.parts && Array.isArray(message.parts)) {
					return message.parts.some((part) => {
						if (typeof part === 'object' && part !== null && 'text' in part) {
							const text = part.text as string;
							if (text.toLowerCase().includes(query.toLowerCase())) {
								const index = text.toLowerCase().indexOf(query.toLowerCase());
								const start = Math.max(0, index - 50);
								const end = Math.min(text.length, index + query.length + 50);
								snippet = text.slice(start, end);
								if (start > 0) snippet = '...' + snippet;
								if (end < text.length) snippet = snippet + '...';
								return true;
							}
						}
						return false;
					});
				}
				return false;
			});

			return {
				id: chat.id,
				title: chat.title,
				pinned: chat.pinned,
				lastMessageAt: chat.lastMessageAt.toISOString(),
				lastModelUsed: chat.lastModelUsed,
				branchedMessageId: chat.branchedMessageId,
				snippet: snippet || '',
				messageCount: chat.messages.length
			};
		});

		return json({ chats: searchResults });
	} catch (err) {
		console.error('Failed to search chats', { userId, query, cause: err });
		error(500, {
			message: "We couldn't search your chats right now. Please try again in a moment."
		});
	}
};
