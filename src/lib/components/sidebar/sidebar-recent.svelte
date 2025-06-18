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

{#if recentChats.unpinned.length === 0}
	<SidebarGroup>
		<SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
		<SidebarGroupContent>
			<p class="text-muted-foreground p-2 text-sm">No recent chats.</p>
		</SidebarGroupContent>
	</SidebarGroup>
{:else}
	{@const grouped = recentChats.groupedUnpinned}
	{#if grouped?.today?.length > 0}
		<SidebarGroup>
			<SidebarGroupLabel>Today</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{#each grouped.today as chat (chat.id)}
						<SidebarItem {chat} />
					{/each}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	{/if}
	{#if grouped?.yesterday?.length > 0}
		<SidebarGroup>
			<SidebarGroupLabel>Yesterday</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{#each grouped.yesterday as chat (chat.id)}
						<SidebarItem {chat} />
					{/each}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	{/if}
	{#if grouped?.last7Days?.length > 0}
		<SidebarGroup>
			<SidebarGroupLabel>Last 7 Days</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{#each grouped.last7Days as chat (chat.id)}
						<SidebarItem {chat} />
					{/each}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	{/if}
	{#if grouped?.last30Days?.length > 0}
		<SidebarGroup>
			<SidebarGroupLabel>Last 30 Days</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{#each grouped.last30Days as chat (chat.id)}
						<SidebarItem {chat} />
					{/each}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	{/if}
	{#if grouped?.older?.length > 0}
		<SidebarGroup>
			<SidebarGroupLabel>Older</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{#each grouped.older as chat (chat.id)}
						<SidebarItem {chat} />
					{/each}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	{/if}
{/if}
