<script lang="ts">
	import { slide } from 'svelte/transition';

	import IconBrain from '~icons/tabler/brain';
	import IconChevronDown from '~icons/tabler/chevron-down';

	import Markdown from '$lib/components/markdown';
	import { Button } from '$lib/components/ui/button';

	let { text, isLoading }: { text: string; isLoading: boolean } = $props();

	let isExpanded = $state(false);
</script>

<div class="mb-2 flex flex-col gap-2">
	<Button
		variant="ghost"
		size="sm"
		class="text-muted-foreground h-auto w-fit justify-start p-1"
		aria-expanded={isExpanded}
		aria-controls="reasoning-content"
		aria-label={isLoading
			? 'AI is thinking...'
			: isExpanded
				? 'Hide AI thought process'
				: 'Show AI thought process'}
		onclick={() => (isExpanded = !isExpanded)}
	>
		{#if isLoading}
			<span class="text-muted-foreground inline-flex animate-pulse items-center gap-1">
				<IconBrain class="size-4" />
				Thinking...
			</span>
		{:else}
			<span class="text-muted-foreground inline-flex items-center gap-1">
				<IconBrain class="size-4" />
				Thought process
			</span>
		{/if}
		<IconChevronDown
			class="ml-1 size-3 transition-transform {isExpanded ? '' : 'rotate-180'}"
			aria-hidden="true"
		/>
	</Button>

	{#if isExpanded}
		<div
			id="reasoning-content"
			transition:slide={{ duration: 300 }}
			aria-label="AI thought process details"
		>
			<div class="overflow-hidden">
				<div class="bg-muted/30 text-muted-foreground rounded-lg border p-4">
					<Markdown source={text} />
				</div>
			</div>
		</div>
	{/if}
</div>
