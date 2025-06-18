import { randomUUID } from 'node:crypto';

import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';

import { JsonToSseTransformStream, createUIMessageStream } from 'ai';
import { eq } from 'drizzle-orm';

import db from '$lib/server/db';
import { chatsTable } from '$lib/server/db/schema';

import { getStreamContext } from '$lib/server/stream';

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.session || !locals.user) {
		error(401, { message: 'You must be signed in to access chat streams.' });
	}

	const userId = locals.user.id;
	const id = params.id;

	if (!id) {
		return new Response('id is required', { status: 400 });
	}

	const chat = await db.query.chatsTable.findFirst({
		where: eq(chatsTable.id, id)
	});

	if (!chat) {
		error(404, { message: 'Chat not found.' });
	}

	if (chat.userId !== userId) {
		error(403, { message: "You don't have access to this chat." });
	}

	if (!chat?.streamId) {
		return new Response('No stream found for this chat', { status: 404 });
	}

	const emptyDataStream = createUIMessageStream({
		generateId: () => randomUUID(),
		execute: () => {}
	});

	const streamContext = await getStreamContext();
	const stream = await streamContext.resumableStream(chat.streamId, () =>
		emptyDataStream.pipeThrough(new JsonToSseTransformStream())
	);

	return new Response(stream, {
		headers: { 'Content-Type': 'text/event-stream' }
	});
};
