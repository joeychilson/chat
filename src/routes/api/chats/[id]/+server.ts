import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';

import { eq } from 'drizzle-orm';

import db from '$lib/server/db';
import { chatsTable } from '$lib/server/db/schema';

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.session || !locals.user) {
		error(401, { message: 'You must be signed in to update a chat.' });
	}

	const userId = locals.user.id;
	const chatId = params.id;

	let title: string | undefined;
	let pinned: boolean | undefined;
	try {
		const body = await request.json();

		if (body.title !== undefined && typeof body.title !== 'string') {
			error(400, { message: 'Chat title must be text.' });
		}

		if (body.title !== undefined && body.title.length > 255) {
			error(400, { message: 'Chat title cannot exceed 255 characters.' });
		}

		if (body.pinned !== undefined && typeof body.pinned !== 'boolean') {
			error(400, { message: 'Pin status must be true or false.' });
		}

		title = body.title;
		pinned = body.pinned;
	} catch (err) {
		console.error('Failed to parse chat update request', { userId, chatId, cause: err });
		error(400, { message: "We couldn't process your request. Please try again." });
	}

	try {
		const existingChat = await db.query.chatsTable.findFirst({ where: eq(chatsTable.id, chatId) });
		if (!existingChat) {
			error(404, { message: "We couldn't find the chat you were looking for." });
		}

		if (existingChat.userId !== userId) {
			error(403, { message: "You don't have permission to update this chat." });
		}

		await db.update(chatsTable).set({ title, pinned }).where(eq(chatsTable.id, chatId));
		return new Response(null, { status: 204 });
	} catch (err) {
		console.error('Failed to update chat', { userId, chatId, cause: err });
		error(500, { message: "We couldn't update your chat right now. Please try again." });
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.session || !locals.user) {
		error(401, { message: 'You must be signed in to delete a chat.' });
	}

	const userId = locals.user.id;
	const chatId = params.id;

	try {
		const existingChat = await db.query.chatsTable.findFirst({ where: eq(chatsTable.id, chatId) });
		if (!existingChat) {
			error(404, { message: "We couldn't find the chat you were looking for." });
		}
		if (existingChat.userId !== userId) {
			error(403, { message: "You don't have permission to delete this chat." });
		}
		await db.delete(chatsTable).where(eq(chatsTable.id, chatId));
		return new Response(null, { status: 204 });
	} catch (err) {
		console.error('Failed to delete chat', { userId, chatId, cause: err });
		error(500, { message: "We couldn't delete your chat right now. Please try again." });
	}
};
