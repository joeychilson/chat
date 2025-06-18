import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';

import { eq } from 'drizzle-orm';

import db from '$lib/server/db';
import { creationsTable } from '$lib/server/db/schema';
import { bucketName, s3Client } from '$lib/server/files';

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.session || !locals.user) {
		error(401, { message: 'You must be signed in to update a creation.' });
	}

	const userId = locals.user.id;
	const creationId = params.id;

	let title: string | undefined;
	try {
		const body = await request.json();

		if (body.title !== undefined && typeof body.title !== 'string') {
			error(400, { message: 'Creation title must be text.' });
		}

		if (body.title !== undefined && body.title.length > 255) {
			error(400, { message: 'Creation title cannot exceed 255 characters.' });
		}

		if (body.title !== undefined && body.title.trim().length === 0) {
			error(400, { message: 'Creation title cannot be empty.' });
		}

		title = body.title;
	} catch (err) {
		console.error('Failed to parse creation update request', { userId, creationId, cause: err });
		error(400, { message: "We couldn't process your request. Please try again." });
	}

	try {
		const existingCreation = await db.query.creationsTable.findFirst({
			where: eq(creationsTable.id, creationId)
		});

		if (!existingCreation) {
			error(404, { message: "We couldn't find the creation you were looking for." });
		}

		if (existingCreation.userId !== userId) {
			error(403, { message: "You don't have permission to update this creation." });
		}

		await db.update(creationsTable).set({ title }).where(eq(creationsTable.id, creationId));
		return new Response(null, { status: 204 });
	} catch (err) {
		console.error('Failed to update creation', { userId, creationId, cause: err });
		error(500, { message: "We couldn't update your creation right now. Please try again." });
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.session || !locals.user) {
		error(401, { message: 'You must be signed in to delete a creation.' });
	}

	const userId = locals.user.id;
	const creationId = params.id;

	try {
		const existingCreation = await db.query.creationsTable.findFirst({
			where: eq(creationsTable.id, creationId),
			with: {
				file: {
					columns: { id: true, path: true }
				}
			}
		});

		if (!existingCreation) {
			error(404, { message: "We couldn't find the creation you were looking for." });
		}

		if (existingCreation.userId !== userId) {
			error(403, { message: "You don't have permission to delete this creation." });
		}

		await db.transaction(async (tx) => {
			await tx.delete(creationsTable).where(eq(creationsTable.id, creationId));
		});

		try {
			await s3Client.removeObject(bucketName, existingCreation.file.path);
		} catch (s3Err) {
			console.error('Failed to delete creation file from storage (file orphaned in S3)', {
				userId,
				creationId: existingCreation.id,
				path: existingCreation.file.path,
				cause: s3Err
			});
		}

		return new Response(null, { status: 204 });
	} catch (err) {
		console.error('Failed to delete creation', { userId, creationId, cause: err });
		error(500, { message: "We couldn't delete your creation right now. Please try again." });
	}
};
