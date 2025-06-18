import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

import { svelteKitHandler } from 'better-auth/svelte-kit';

import { auth } from '$lib/server/auth';

const authHandler: Handle = async ({ event, resolve }) => {
	return svelteKitHandler({ event, resolve, auth });
};

const authRedirect: Handle = async ({ event, resolve }) => {
	const publicPaths = ['/api', '/signin'];

	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (session) {
		if (event.url.pathname === '/signin') {
			return redirect(303, '/');
		}
	} else {
		if (!publicPaths.some((path) => event.url.pathname.startsWith(path))) {
			return redirect(303, '/signin');
		}
	}

	event.locals.session = session?.session;
	event.locals.user = session?.user;

	return await resolve(event);
};

export const handle = sequence(authHandler, authRedirect);
