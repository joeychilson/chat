import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, fetch }) => {
	const [recentChatsData, recentFilesData] = await Promise.all([
		fetch('/api/chats?limit=50').then((res) => res.json()),
		fetch('/api/files?limit=5').then((res) => res.json())
	]);

	const { chats } = recentChatsData;
	const { files } = recentFilesData;

	return {
		recentChats: chats,
		recentFiles: files,
		...data
	};
};
