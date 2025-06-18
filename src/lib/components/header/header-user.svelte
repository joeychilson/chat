<script lang="ts">
	import { goto } from '$app/navigation';

	import type { User } from 'better-auth';
	import { setMode, mode } from 'mode-watcher';
	import { toast } from 'svelte-sonner';

	import IconChartBar from '~icons/tabler/chart-bar';
	import IconLogOut from '~icons/tabler/logout';
	import IconMoon from '~icons/tabler/moon';
	import IconSettings from '~icons/tabler/settings';
	import IconSun from '~icons/tabler/sun';

	import { signOut } from '$lib/auth';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';

	let { user }: { user: User } = $props();
</script>

<DropdownMenu>
	<DropdownMenuTrigger>
		{#snippet child({ props })}
			<Avatar
				class="size-8 rounded-md"
				aria-label="User menu for {user?.name || 'User'}"
				{...props}
			>
				{#if user && user.image}
					<AvatarImage src={user.image} alt={user.name || 'User avatar'} />
				{/if}
				<AvatarFallback class="size-8 rounded-md">
					{user?.name?.[0] || '?'}
				</AvatarFallback>
			</Avatar>
		{/snippet}
	</DropdownMenuTrigger>
	<DropdownMenuContent align="end" preventScroll={false}>
		<DropdownMenuItem
			onclick={async () => {
				goto('/stats');
			}}
		>
			<IconChartBar class="size-4" />
			<span>Stats</span>
		</DropdownMenuItem>
		<DropdownMenuItem
			onclick={async () => {
				goto('/settings');
			}}
		>
			<IconSettings class="size-4" />
			<span>Settings</span>
		</DropdownMenuItem>
		<DropdownMenuItem
			onclick={() => {
				if (mode.current === 'light') {
					setMode('dark');
				} else {
					setMode('light');
				}
			}}
		>
			{#if mode.current === 'light'}
				<IconMoon class="size-4" />
				<span>Dark Mode</span>
			{:else}
				<IconSun class="size-4" />
				<span>Light Mode</span>
			{/if}
		</DropdownMenuItem>
		<DropdownMenuItem
			onclick={async () => {
				await signOut();
				goto('/signin', { invalidateAll: true });
				toast.success('Goodbye! Hope to see you back soon!');
			}}
		>
			<IconLogOut class="size-4" />
			<span>Sign out</span>
		</DropdownMenuItem>
	</DropdownMenuContent>
</DropdownMenu>
