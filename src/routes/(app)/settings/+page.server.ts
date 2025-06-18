import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

import { auth } from '$lib/server/auth';
import db from '$lib/server/db';
import { settingsTable } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ locals, request }) => {
	if (!locals.session || !locals.user) {
		redirect(302, '/signin');
	}

	const userSettings = await db.query.settingsTable.findFirst({
		where: eq(settingsTable.userId, locals.user.id)
	});

	const sessions = await auth.api.listSessions({ headers: request.headers });
	return {
		sessions: sessions || [],
		user: locals.user,
		userSettings
	};
};
