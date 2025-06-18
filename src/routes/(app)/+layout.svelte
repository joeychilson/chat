<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	import Header from '$lib/components/header';
	import Sidebar from '$lib/components/sidebar';
	import { SidebarProvider, SidebarInset } from '$lib/components/ui/sidebar';
	import { RecentChats } from '$lib/stores/recent-chats.svelte';
	import { RecentFiles } from '$lib/stores/recent-files.svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const recentChats = new RecentChats(data.recentChats);
	recentChats.setContext();

	const recentFiles = new RecentFiles(data.recentFiles);
	recentFiles.setContext();
</script>

<SidebarProvider open={false}>
	<Sidebar />
	<SidebarInset>
		<Header user={data.user} />
		<main class="relative h-dvh flex-shrink flex-grow">
			{@render children()}
		</main>
	</SidebarInset>
</SidebarProvider>
