import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';

import { eq, desc, and, inArray } from 'drizzle-orm';

import db from '$lib/server/db';
import { chatsTable } from '$lib/server/db/schema';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.session || !locals.user) {
		error(401, { message: 'You must be signed in to view your chats.' });
	}

	const userId = locals.user.id;
	const limitParam = url.searchParams.get('limit');
	const limit = limitParam ? parseInt(limitParam, 10) : undefined;

	try {
		const chats = await db.query.chatsTable.findMany({
			where: eq(chatsTable.userId, userId),
			columns: {
				id: true,
				title: true,
				pinned: true,
				lastMessageAt: true,
				branchedMessageId: true
			},
			orderBy: desc(chatsTable.lastMessageAt),
			...(limit && limit > 0 && { limit })
		});

		return json({ chats });
	} catch (err) {
		console.error('Failed to get chats', { userId, cause: err });
		error(500, {
			message: "We couldn't load your chats right now. Please refresh or try again in a moment."
		});
	}
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.session || !locals.user) {
		error(401, { message: 'You must be signed in to delete chat(s).' });
	}
	const userId = locals.user.id;

	let ids: string[];
	try {
		const body = await request.json();

		if (!body.ids) {
			error(400, { message: 'Chat IDs are required for deletion.' });
		}

		if (!Array.isArray(body.ids)) {
			error(400, { message: 'Chat IDs must be provided as an array.' });
		}

		if (body.ids.length === 0 || body.ids.some((id: string) => typeof id !== 'string')) {
			error(400, { message: 'Please provide valid chat IDs for deletion.' });
		}

		ids = body.ids;
	} catch (err) {
		console.error('Failed to parse delete request', { userId, cause: err });
		error(400, { message: "We couldn't process your request. Please try again." });
	}

	try {
		await db
			.delete(chatsTable)
			.where(and(eq(chatsTable.userId, userId), inArray(chatsTable.id, ids)));
		return new Response(null, { status: 204 });
	} catch (err) {
		console.error('Failed to delete chats', { userId, chatIds: ids, cause: err });
		error(500, { message: "We couldn't delete your chats right now. Please try again." });
	}
};
