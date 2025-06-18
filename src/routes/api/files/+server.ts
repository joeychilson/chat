import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';

import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { and, desc, eq, ilike, inArray, sql } from 'drizzle-orm';

import { type File as ChatFile, MAX_FILE_SIZE, isFileAllowed } from '$lib/files';
import db from '$lib/server/db';
import { filesTable, messagesTable } from '$lib/server/db/schema';
import { bucketName, getFileUrl, s3Client } from '$lib/server/files';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.session || !locals.user) {
		error(401, { message: 'You must be signed in to view your files.' });
	}

	const userId = locals.user.id;
	const searchQuery = url.searchParams.get('q');
	const limitParam = url.searchParams.get('limit');
	const limit = limitParam ? Math.max(1, Math.min(parseInt(limitParam, 10) || 20, 100)) : undefined;

	try {
		const whereConditions = [eq(filesTable.userId, userId)];
		if (searchQuery) {
			whereConditions.push(ilike(filesTable.name, `%${searchQuery}%`));
		}

		const userFiles = await db.query.filesTable.findMany({
			where: and(...whereConditions),
			columns: { id: true, name: true, mediaType: true, path: true, createdAt: true },
			orderBy: desc(filesTable.createdAt),
			...(limit && limit > 0 && { limit })
		});

		const files: ChatFile[] = userFiles.map((file) => ({
			id: file.id,
			name: file.name,
			mediaType: file.mediaType as ChatFile['mediaType'],
			url: getFileUrl(file.path),
			createdAt: file.createdAt
		}));

		return json({ files });
	} catch (err) {
		console.error('Failed to fetch files', { userId, cause: err });
		error(500, {
			message: "We couldn't load your files right now. Please refresh or try again in a moment."
		});
	}
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.session || !locals.user) {
		error(401, { message: 'You must be signed in to upload files.' });
	}
	const userId = locals.user.id;

	let file: File;
	try {
		const formData = await request.formData();
		const fileData = formData.get('file');

		if (!fileData) {
			error(400, { message: 'Please select a file to upload.' });
		}

		if (!(fileData instanceof File)) {
			error(400, { message: 'Please provide a valid file.' });
		}

		file = fileData;
	} catch (err) {
		console.error('Failed to parse file upload request', { userId, cause: err });
		error(400, { message: "We couldn't process your file upload. Please try again." });
	}

	if (file.size > MAX_FILE_SIZE) {
		error(400, { message: 'Your file is too large. Please choose a file smaller than 50MB.' });
	}

	if (!Number.isFinite(file.size)) {
		error(400, { message: 'Invalid file size. Please try uploading the file again.' });
	}

	const fileValidation = isFileAllowed(file);
	if (!fileValidation.allowed) {
		error(400, { message: 'This file type is not supported. Please choose a different file.' });
	}

	const finalMediaType = fileValidation.detectedType || file.type;

	const uuid = randomUUID();
	const fileExtension = extname(file.name);
	const path = `${userId}/${uuid}${fileExtension}`;
	const fileBuffer = await file.arrayBuffer();

	try {
		await s3Client.putObject(bucketName, path, Buffer.from(fileBuffer), undefined, {
			'Content-Type': finalMediaType
		});

		const [savedFile] = await db
			.insert(filesTable)
			.values({
				userId,
				name: file.name,
				mediaType: finalMediaType,
				size: file.size,
				path
			})
			.returning();

		return json({
			id: savedFile.id,
			name: savedFile.name,
			mediaType: savedFile.mediaType as ChatFile['mediaType'],
			url: getFileUrl(savedFile.path)
		});
	} catch (err) {
		console.error('Failed to upload file', { userId, fileName: file.name, cause: err });
		error(500, { message: "We couldn't upload your file right now. Please try again." });
	}
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.session || !locals.user) {
		error(401, { message: 'You must be signed in to delete files.' });
	}
	const userId = locals.user.id;

	let ids: string[];
	try {
		const body = await request.json();

		if (!body.ids) {
			error(400, { message: 'File IDs are required for deletion.' });
		}

		if (!Array.isArray(body.ids)) {
			error(400, { message: 'File IDs must be provided as an array.' });
		}

		if (body.ids.length === 0 || body.ids.some((id: string) => typeof id !== 'string')) {
			error(400, { message: 'Please provide valid file IDs for deletion.' });
		}

		ids = body.ids;
	} catch (err) {
		console.error('Failed to parse file delete request', { userId, cause: err });
		error(400, { message: "We couldn't process your request. Please try again." });
	}

	const filesToDelete = await db.query.filesTable.findMany({
		columns: { id: true, path: true },
		where: and(eq(filesTable.userId, userId), inArray(filesTable.id, ids))
	});

	const deleteResults = await Promise.allSettled(
		filesToDelete.map(async (fileInfo) => {
			const [dbResult, s3Result] = await Promise.allSettled([
				db.transaction(async (tx) => {
					await tx
						.delete(filesTable)
						.where(and(eq(filesTable.userId, userId), eq(filesTable.id, fileInfo.id)));

					await tx
						.update(messagesTable)
						.set({
							parts: sql`(
								SELECT COALESCE(
									CASE
										WHEN jsonb_typeof(parts) = 'array' THEN
											(SELECT jsonb_agg(part)
											 FROM jsonb_array_elements(parts) AS part
											 WHERE NOT (
												 part->>'type' = 'file' AND
												 part->>'url' = ${getFileUrl(fileInfo.path)}
											 ))
										ELSE parts
									END,
									'[]'::jsonb
								)
							)`,
							updatedAt: new Date()
						})
						.where(
							sql`jsonb_typeof(parts) = 'array' AND EXISTS (
								SELECT 1
								FROM jsonb_array_elements(parts) AS part
								WHERE part->>'type' = 'file' AND part->>'url' = ${getFileUrl(fileInfo.path)}
							)`
						);
				}),
				s3Client.removeObject(bucketName, fileInfo.path)
			]);

			if (dbResult.status === 'rejected') {
				console.error('Failed to delete file from database', {
					userId,
					fileId: fileInfo.id,
					path: fileInfo.path,
					cause: dbResult.reason
				});
				throw dbResult.reason;
			}

			if (s3Result.status === 'rejected') {
				console.error('Failed to delete file from storage (file orphaned in S3)', {
					userId,
					fileId: fileInfo.id,
					path: fileInfo.path,
					cause: s3Result.reason
				});
			}

			return fileInfo.id;
		})
	);

	const failedDeletions = deleteResults.filter((result) => result.status === 'rejected');
	if (failedDeletions.length > 0) {
		console.error('Some file deletions failed', {
			userId,
			failedCount: failedDeletions.length,
			totalCount: filesToDelete.length
		});
		error(500, { message: "We couldn't delete some of your files right now. Please try again." });
	}

	return new Response(null, { status: 204 });
};
