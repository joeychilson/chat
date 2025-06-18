<script lang="ts">
	import {
		SidebarGroup,
		SidebarGroupLabel,
		SidebarGroupContent,
		SidebarMenu
	} from '$lib/components/ui/sidebar';
	import { RecentChats } from '$lib/stores/recent-chats.svelte';

	import SidebarItem from './sidebar-item.svelte';

	const recentChats = RecentChats.fromContext();
</script>

{#if recentChats.pinned.length > 0}
	<SidebarGroup>
		<SidebarGroupLabel>Pinned Chats</SidebarGroupLabel>
		<SidebarGroupContent>
			<SidebarMenu>
				{#each recentChats.pinned as chat (chat.id)}
					<SidebarItem {chat} />
				{/each}
			</SidebarMenu>
		</SidebarGroupContent>
	</SidebarGroup>
{/if}
