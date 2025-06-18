import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';

import { and, desc, eq, ilike, inArray } from 'drizzle-orm';

import db from '$lib/server/db';
import { creationsTable } from '$lib/server/db/schema';
import { bucketName, getFileUrl, s3Client } from '$lib/server/files';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.session || !locals.user) {
		error(401, { message: 'You must be signed in to view your creations.' });
	}

	const userId = locals.user.id;
	const searchQuery = url.searchParams.get('q');
	const typeFilter = url.searchParams.get('type');
	const limitParam = url.searchParams.get('limit');
	const limit = limitParam ? Math.max(1, Math.min(parseInt(limitParam, 10) || 20, 100)) : undefined;

	try {
		const whereConditions = [eq(creationsTable.userId, userId)];

		if (searchQuery) {
			whereConditions.push(ilike(creationsTable.title, `%${searchQuery}%`));
		}

		if (typeFilter && ['image', 'video', 'audio', 'document'].includes(typeFilter)) {
			whereConditions.push(
				eq(creationsTable.type, typeFilter as 'image' | 'video' | 'audio' | 'document')
			);
		}

		const userCreations = await db.query.creationsTable.findMany({
			where: and(...whereConditions),
			with: {
				file: {
					columns: { id: true, name: true, mediaType: true, path: true, size: true }
				}
			},
			orderBy: desc(creationsTable.createdAt),
			...(limit && limit > 0 && { limit })
		});

		const creations = userCreations.map((creation) => ({
			id: creation.id,
			type: creation.type,
			title: creation.title,
			metadata: creation.metadata,
			createdAt: creation.createdAt,
			updatedAt: creation.updatedAt,
			file: {
				id: creation.file.id,
				name: creation.file.name,
				mediaType: creation.file.mediaType,
				url: getFileUrl(creation.file.path),
				size: creation.file.size
			}
		}));

		return json({ creations });
	} catch (err) {
		console.error('Failed to fetch creations', { userId, cause: err });
		error(500, {
			message: "We couldn't load your creations right now. Please refresh or try again in a moment."
		});
	}
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.session || !locals.user) {
		error(401, { message: 'You must be signed in to delete creations.' });
	}
	const userId = locals.user.id;

	let ids: string[];
	try {
		const body = await request.json();

		if (!body.ids) {
			error(400, { message: 'Creation IDs are required for deletion.' });
		}

		if (!Array.isArray(body.ids)) {
			error(400, { message: 'Creation IDs must be provided as an array.' });
		}

		if (body.ids.length === 0 || body.ids.some((id: string) => typeof id !== 'string')) {
			error(400, { message: 'Please provide valid creation IDs for deletion.' });
		}

		ids = body.ids;
	} catch (err) {
		console.error('Failed to parse creation delete request', { userId, cause: err });
		error(400, { message: "We couldn't process your request. Please try again." });
	}

	const creationsToDelete = await db.query.creationsTable.findMany({
		where: and(eq(creationsTable.userId, userId), inArray(creationsTable.id, ids)),
		with: {
			file: {
				columns: { id: true, path: true }
			}
		}
	});

	const deleteResults = await Promise.allSettled(
		creationsToDelete.map(async (creation) => {
			const [dbResult, s3Result] = await Promise.allSettled([
				db.transaction(async (tx) => {
					await tx
						.delete(creationsTable)
						.where(and(eq(creationsTable.userId, userId), eq(creationsTable.id, creation.id)));
				}),
				s3Client.removeObject(bucketName, creation.file.path)
			]);

			if (dbResult.status === 'rejected') {
				console.error('Failed to delete creation from database', {
					userId,
					creationId: creation.id,
					cause: dbResult.reason
				});
				throw dbResult.reason;
			}

			if (s3Result.status === 'rejected') {
				console.error('Failed to delete creation file from storage (file orphaned in S3)', {
					userId,
					creationId: creation.id,
					path: creation.file.path,
					cause: s3Result.reason
				});
			}

			return creation.id;
		})
	);

	const failedDeletions = deleteResults.filter((result) => result.status === 'rejected');
	if (failedDeletions.length > 0) {
		console.error('Some creation deletions failed', {
			userId,
			failedCount: failedDeletions.length,
			totalCount: creationsToDelete.length
		});
		error(500, {
			message: "We couldn't delete some of your creations right now. Please try again."
		});
	}

	return new Response(null, { status: 204 });
};
