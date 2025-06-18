import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';

import { eq, sql } from 'drizzle-orm';

import db from '$lib/server/db';
import { filesTable, messagesTable } from '$lib/server/db/schema';
import { bucketName, getFileUrl, s3Client } from '$lib/server/files';

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.session || !locals.user) {
		error(401, { message: 'You must be signed in to update a file.' });
	}

	const userId = locals.user.id;
	const fileId = params.id;

	let name: string | undefined;
	try {
		const body = await request.json();

		if (body.name !== undefined && typeof body.name !== 'string') {
			error(400, { message: 'File name must be text.' });
		}

		if (body.name !== undefined && body.name.length > 255) {
			error(400, { message: 'File name cannot exceed 255 characters.' });
		}

		if (body.name !== undefined && body.name.trim().length === 0) {
			error(400, { message: 'File name cannot be empty.' });
		}

		name = body.name;
	} catch (err) {
		console.error('Failed to parse file update request', { userId, fileId, cause: err });
		error(400, { message: "We couldn't process your request. Please try again." });
	}

	try {
		const existingFile = await db.query.filesTable.findFirst({ where: eq(filesTable.id, fileId) });
		if (!existingFile) {
			error(404, { message: "We couldn't find the file you were looking for." });
		}

		if (existingFile.userId !== userId) {
			error(403, { message: "You don't have permission to update this file." });
		}

		await db.update(filesTable).set({ name }).where(eq(filesTable.id, fileId));
		return new Response(null, { status: 204 });
	} catch (err) {
		console.error('Failed to update file', { userId, fileId, cause: err });
		error(500, { message: "We couldn't update your file right now. Please try again." });
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.session || !locals.user) {
		error(401, { message: 'You must be signed in to delete a file.' });
	}

	const userId = locals.user.id;
	const fileId = params.id;

	try {
		const existingFile = await db.query.filesTable.findFirst({
			where: eq(filesTable.id, fileId),
			columns: { id: true, path: true, userId: true }
		});

		if (!existingFile) {
			error(404, { message: "We couldn't find the file you were looking for." });
		}

		if (existingFile.userId !== userId) {
			error(403, { message: "You don't have permission to delete this file." });
		}

		try {
			await db.transaction(async (tx) => {
				await tx
					.update(messagesTable)
					.set({
						parts: sql`(
							SELECT COALESCE(jsonb_agg(part), '[]'::jsonb)
							FROM jsonb_array_elements(parts) AS part
							WHERE NOT (
								part->>'type' = 'file' AND
								part->>'url' = ${getFileUrl(existingFile.path)}
							)
						)`,
						updatedAt: new Date()
					})
					.where(
						sql`EXISTS (
							SELECT 1
							FROM jsonb_array_elements(parts) AS part
							WHERE part->>'type' = 'file' AND part->>'url' = ${getFileUrl(existingFile.path)}
						)`
					);

				await tx.delete(filesTable).where(eq(filesTable.id, fileId));
			});

			try {
				await s3Client.removeObject(bucketName, existingFile.path);
			} catch (s3Err) {
				console.error('Failed to delete file from S3 storage (file orphaned)', {
					userId,
					fileId: existingFile.id,
					path: existingFile.path,
					cause: s3Err
				});
			}
		} catch (dbErr) {
			console.error('Failed to delete file from database', {
				userId,
				fileId: existingFile.id,
				path: existingFile.path,
				cause: dbErr
			});
			error(500, { message: "We couldn't delete your file right now. Please try again." });
		}

		return new Response(null, { status: 204 });
	} catch (err) {
		console.error('Failed to delete file', { userId, fileId, cause: err });
		error(500, { message: "We couldn't delete your file right now. Please try again." });
	}
};
