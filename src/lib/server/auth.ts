import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { customSession } from 'better-auth/plugins/custom-session';
import { eq } from 'drizzle-orm';

import db from '$lib/server/db';
import {
	accountsTable,
	sessionsTable,
	usersTable,
	verificationsTable,
	settingsTable
} from '$lib/server/db/schema';

export const auth = betterAuth({
	baseURL: publicEnv.PUBLIC_BASE_URL,
	secret: privateEnv.AUTH_SECRET as string,
	advanced: {
		database: { generateId: false }
	},
	socialProviders: {
		google: {
			clientId: privateEnv.GOOGLE_CLIENT_ID as string,
			clientSecret: privateEnv.GOOGLE_CLIENT_SECRET as string
		}
	},
	database: drizzleAdapter(db, {
		provider: 'pg',
		usePlural: true,
		schema: {
			users: usersTable,
			accounts: accountsTable,
			sessions: sessionsTable,
			verifications: verificationsTable
		}
	}),
	user: {
		deleteUser: { enabled: true }
	},
	plugins: [
		customSession(async ({ user, session }) => {
			const userSettings = await db.query.settingsTable.findFirst({
				where: eq(settingsTable.userId, session.userId)
			});

			return {
				user,
				session,
				settings: userSettings || null
			};
		})
	]
});
