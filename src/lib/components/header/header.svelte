<script lang="ts">
	import { goto } from '$app/navigation';
	import { slide } from 'svelte/transition';

	import type { User } from 'better-auth';

	import IconLayoutSidebarLeftExpand from '~icons/tabler/layout-sidebar-left-expand';
	import IconMessagePlus from '~icons/tabler/message-plus';
	import IconMessageSearch from '~icons/tabler/message-search';

	import { Button } from '$lib/components/ui/button';
	import { useSidebar } from '$lib/components/ui/sidebar';
	import Search from '$lib/components/search/search.svelte';

	import HeaderUser from './header-user.svelte';

	const sidebar = useSidebar();

	let { user }: { user: User } = $props();

	let searchOpen = $state(false);
</script>

<svelte:document
	onkeydown={(e) => {
		if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
			e.preventDefault();
			goto('/', { invalidateAll: true });
		}
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			searchOpen = true;
		}
	}}
/>

<header
	class="bg-background/80 fixed inset-x-0 top-0 z-10 flex h-14 items-center justify-between gap-4 px-4 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none"
>
	<div class="flex items-center gap-4">
		{#if sidebar.isMobile || sidebar.state === 'collapsed'}
			<div
				in:slide={{ duration: 200, delay: 200, axis: 'x' }}
				out:slide={{ duration: 200, axis: 'x' }}
			>
				<Button variant="ghost" size="icon" onclick={() => sidebar.toggle()}>
					<IconLayoutSidebarLeftExpand class="size-5" />
					<span class="sr-only">Open Sidebar</span>
				</Button>
			</div>
		{/if}
	</div>
	<div class="flex items-center gap-2">
		<Button variant="ghost" size="icon" onclick={() => (searchOpen = true)}>
			<IconMessageSearch class="size-5" />
			<span class="sr-only">Search</span>
		</Button>
		<Button variant="ghost" size="icon" onclick={() => goto('/', { invalidateAll: true })}>
			<IconMessagePlus class="size-5" />
			<span class="sr-only">New Message</span>
		</Button>
		<HeaderUser {user} />
	</div>
</header>

<Search bind:open={searchOpen} />
