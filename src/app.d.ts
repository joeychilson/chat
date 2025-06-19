import type { User, Session } from 'better-auth';
import 'unplugin-icons/types/svelte';

import type { Settings } from '$lib/server/db/schema';

declare global {
	namespace App {
		interface Locals {
			session:
				| (Session & {
						settings: Settings | null;
				  })
				| undefined;
			user: User | undefined;
		}
	}
}

export {};
