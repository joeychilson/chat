<script lang="ts">
	import IconMessageChatbot from '~icons/tabler/message-chatbot';
	import IconLayoutSidebarLeftCollapse from '~icons/tabler/layout-sidebar-left-collapse';

	import { Button } from '$lib/components/ui/button';
	import { Sidebar, SidebarHeader, SidebarContent, useSidebar } from '$lib/components/ui/sidebar';

	import SidebarNav from './sidebar-nav.svelte';
	import SidebarPinned from './sidebar-pinned.svelte';
	import SidebarRecent from './sidebar-recent.svelte';

	const sidebar = useSidebar();
</script>

<Sidebar>
	<SidebarHeader>
		<div class="flex w-full items-center justify-between">
			<div class="ml-2 flex items-center gap-2">
				<IconMessageChatbot class="size-5" />
				<h1 class="text-foreground text-xl font-semibold">Chat</h1>
			</div>
			<Button variant="ghost" size="icon" onclick={() => sidebar.toggle()}>
				<IconLayoutSidebarLeftCollapse class="size-5" />
				<span class="sr-only">Close Sidebar</span>
			</Button>
		</div>
	</SidebarHeader>
	<SidebarContent class="overflow-hidden">
		<div class="flex flex-col gap-2">
			<SidebarNav />
			<SidebarPinned />
		</div>
		<div class="min-h-0 flex-1 overflow-auto">
			<SidebarRecent />
		</div>
	</SidebarContent>
</Sidebar>
