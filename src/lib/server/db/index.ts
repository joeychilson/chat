import { env } from '$env/dynamic/private';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const client = postgres(env.DATABASE_URL!);

const db = drizzle({ client, schema });

export default db;
