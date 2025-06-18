<script lang="ts">
	import type { PageData } from './$types';

	import Chat from '$lib/components/chat';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Chat</title>
</svelte:head>

{#key data.currentChat.id}
	<Chat
		id={data.currentChat.id}
		model={data.currentChat.model}
		messages={data.currentChat.messages}
		title={data.currentChat.title}
		prompt={data.currentChat.prompt}
		user={data.user}
	/>
{/key}
