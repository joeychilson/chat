<script lang="ts">
	import { page } from '$app/state';

	import IconFiles from '~icons/tabler/files';
	import IconMessages from '~icons/tabler/messages';
	import IconSparkles from '~icons/tabler/sparkles';

	import {
		SidebarMenuButton,
		SidebarMenuItem,
		SidebarGroup,
		SidebarGroupLabel,
		SidebarGroupContent,
		SidebarMenu
	} from '$lib/components/ui/sidebar';
</script>

<SidebarGroup>
	<SidebarGroupLabel>Workspace</SidebarGroupLabel>
	<SidebarGroupContent>
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton>
					{#snippet child({ props })}
						<a
							href="/chats"
							class:bg-accent={page.url.pathname === '/chats'}
							aria-current={page.url.pathname === '/chats' ? 'page' : undefined}
							{...props}
						>
							<IconMessages class="text-muted-foreground size-4" aria-hidden="true" />
							Chats
						</a>
					{/snippet}
				</SidebarMenuButton>
			</SidebarMenuItem>
			<SidebarMenuItem>
				<SidebarMenuButton>
					{#snippet child({ props })}
						<a
							href="/creations"
							class:bg-accent={page.url.pathname === '/creations'}
							aria-current={page.url.pathname === '/creations' ? 'page' : undefined}
							{...props}
						>
							<IconSparkles class="text-muted-foreground size-4" aria-hidden="true" />
							Creations
						</a>
					{/snippet}
				</SidebarMenuButton>
			</SidebarMenuItem>
			<SidebarMenuItem>
				<SidebarMenuButton>
					{#snippet child({ props })}
						<a
							href="/files"
							class:bg-accent={page.url.pathname === '/files'}
							aria-current={page.url.pathname === '/files' ? 'page' : undefined}
							{...props}
						>
							<IconFiles class="text-muted-foreground size-4" aria-hidden="true" />
							Files
						</a>
					{/snippet}
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	</SidebarGroupContent>
</SidebarGroup>
