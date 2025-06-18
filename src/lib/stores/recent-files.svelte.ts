import { getContext, setContext } from 'svelte';

import type { File } from '$lib/files';

const contextKey = Symbol('recent-files');

export class RecentFiles {
	files = $state<File[]>([]);

	constructor(files: File[]) {
		this.files = files;
	}

	async refetch() {
		const res = await fetch('/api/files?limit=5');

		if (res.ok) {
			const data: { files: File[] } = await res.json();
			this.files = data.files;
		}
	}

	setContext() {
		setContext(contextKey, this);
	}

	static fromContext(): RecentFiles {
		return getContext(contextKey);
	}
}
