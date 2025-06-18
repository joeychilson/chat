import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';

import type { UIMessage } from 'ai';
import { eq } from 'drizzle-orm';

import db from '$lib/server/db';
import { messagesTable } from '$lib/server/db/schema';

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.session || !locals.user) {
		error(401, { message: 'You must be signed in to update a message.' });
	}

	const userId = locals.user.id;
	const messageId = params.id;

	let parts: UIMessage['parts'];
	try {
		const data = await request.json();

		if (!data.parts || typeof data.parts !== 'object') {
			error(400, { message: 'Message content is required.' });
		}

		if (!Array.isArray(data.parts) || data.parts.length === 0) {
			error(400, { message: 'Please provide valid message content.' });
		}

		parts = data.parts;
	} catch (err) {
		console.error('Failed to parse message update request', { userId, messageId, cause: err });
		error(400, { message: "We couldn't process your request. Please try again." });
	}

	try {
		const message = await db.query.messagesTable.findFirst({
			where: eq(messagesTable.id, messageId),
			with: { chat: true }
		});

		if (!message) {
			error(404, { message: "We couldn't find the message you were looking for." });
		}

		if (message.chat.userId !== userId) {
			error(403, { message: "You don't have permission to update this message." });
		}

		await db.update(messagesTable).set({ parts }).where(eq(messagesTable.id, messageId));

		return new Response(null, { status: 204 });
	} catch (err) {
		console.error('Failed to update message', { userId, messageId, cause: err });
		error(500, { message: "We couldn't update your message right now. Please try again." });
	}
};
