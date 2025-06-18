import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/lib/server/db/schema.ts',
	out: './migrations',
	dbCredentials: {
		url: process.env.DATABASE_URL as string
	}
});
