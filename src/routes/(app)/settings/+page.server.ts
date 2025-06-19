import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

import { auth } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals, request }) => {
	if (!locals.session || !locals.user) {
		redirect(302, '/signin');
	}

	const sessions = await auth.api.listSessions({ headers: request.headers });
	return {
		sessions: sessions || [],
		user: locals.user,
		userSettings: locals.session.settings
	};
};
