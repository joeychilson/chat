import type { PageServerLoad } from './$types';
import { desc } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';

import db from '$lib/server/db';
import { creationsTable } from '$lib/server/db/schema';
import { getFileUrl } from '$lib/server/files';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session || !locals.user) {
		redirect(302, '/signin');
	}

	const userId = locals.user.id;

	try {
		const userCreations = await db.query.creationsTable.findMany({
			where: (creations, { eq }) => eq(creations.userId, userId),
			with: {
				file: {
					columns: { id: true, name: true, mediaType: true, path: true, size: true }
				}
			},
			orderBy: desc(creationsTable.createdAt)
		});

		const creations = userCreations.map((creation) => ({
			id: creation.id,
			type: creation.type,
			title: creation.title,
			metadata: creation.metadata,
			createdAt: creation.createdAt.toISOString(),
			updatedAt: creation.updatedAt.toISOString(),
			file: {
				id: creation.file.id,
				name: creation.file.name,
				mediaType: creation.file.mediaType,
				url: getFileUrl(creation.file.path),
				size: creation.file.size
			}
		}));

		return { creations };
	} catch (err) {
		console.error('Failed to fetch creations', { userId, cause: err });
		error(500, { message: "We couldn't load your creations right now. Please try again." });
	}
};
