<script lang="ts">
	import type { PageData } from './$types';

	import Chat from '$lib/components/chat';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.currentChat.title}</title>
</svelte:head>

{#key data.currentChat.id}
	<Chat
		id={data.currentChat.id}
		model={data.currentChat.model}
		messages={data.currentChat.messages}
		resume={data.currentChat.resume}
	/>
{/key}
