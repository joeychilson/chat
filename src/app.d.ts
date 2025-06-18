import type { User, Session } from 'better-auth';
import 'unplugin-icons/types/svelte';

declare global {
	namespace App {
		interface Locals {
			session: Session | undefined;
			user: User | undefined;
		}
	}
}

export {};
