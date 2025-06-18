import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { eq, desc } from 'drizzle-orm';

import db from '$lib/server/db';
import { filesTable, creationsTable } from '$lib/server/db/schema';
import { getFileUrl } from '$lib/server/files';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session || !locals.user) {
		redirect(302, '/signin');
	}

	const userId = locals.user.id;

	try {
		const [files, creations] = await Promise.all([
			db.query.filesTable.findMany({
				where: eq(filesTable.userId, userId),
				orderBy: desc(filesTable.createdAt)
			}),
			db.query.creationsTable.findMany({
				where: eq(creationsTable.userId, userId),
				columns: {
					fileId: true
				}
			})
		]);

		const creationFileIds = new Set(creations.map((creation) => creation.fileId));

		return {
			files: files.map((file) => ({
				id: file.id,
				name: file.name,
				mediaType: file.mediaType,
				size: file.size,
				url: getFileUrl(file.path),
				createdAt: file.createdAt.toISOString(),
				updatedAt: file.updatedAt.toISOString(),
				isCreation: creationFileIds.has(file.id)
			}))
		};
	} catch (err) {
		console.error('Failed to load files', { userId, cause: err });
		error(500, { message: "We couldn't load your files right now. Please try again." });
	}
};
