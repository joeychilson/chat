<script lang="ts">
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import type { Message } from '$lib/messages';
	import { getModelName, getModelConfig } from '$lib/models';

	let { message }: { message: Message } = $props();

	let modelConfig = $derived(
		message.metadata?.model?.id ? getModelConfig(message.metadata.model.id) : undefined
	);
</script>

{#if modelConfig?.availableOptions && modelConfig.availableOptions.length > 0}
	<Popover>
		<PopoverTrigger>
			{#snippet child({ props })}
				<button
					{...props}
					class="hover:text-foreground flex cursor-pointer items-center gap-1 underline decoration-dotted underline-offset-2 transition-colors"
					aria-label="View model options for {getModelName(message.metadata?.model?.id || '')}"
				>
					{#if modelConfig?.provider.icon}
						{@const IconComponent = modelConfig.provider.icon}
						<IconComponent class="size-3" />
					{/if}
					{getModelName(message.metadata?.model?.id || '')}
				</button>
			{/snippet}
		</PopoverTrigger>
		<PopoverContent
			side="top"
			align="start"
			class="w-72 max-w-[calc(100vw-1rem)] p-4 sm:w-56 sm:p-3"
		>
			<div class="space-y-3">
				<div class="flex items-center gap-2">
					{#if modelConfig?.provider.icon}
						{@const IconComponent = modelConfig.provider.icon}
						<IconComponent class="text-muted-foreground size-4" />
					{/if}
					<h3 class="text-sm font-medium">Model Options</h3>
				</div>

				<div class="grid gap-3 text-sm sm:gap-2">
					{#each modelConfig?.availableOptions || [] as option (option.key)}
						{@const currentValue =
							message.metadata?.model?.options?.[option.key] ?? option.defaultValue}
						<div class="flex items-center justify-between">
							<span class="text-muted-foreground">{option.label}</span>
							<span class="font-mono font-medium">
								{#if typeof currentValue === 'boolean'}
									{currentValue ? 'Yes' : 'No'}
								{:else if typeof currentValue === 'object' && currentValue !== null}
									{JSON.stringify(currentValue)}
								{:else}
									{currentValue}
								{/if}
							</span>
						</div>
					{/each}
				</div>
			</div>
		</PopoverContent>
	</Popover>
{:else}
	<div class="flex items-center gap-1">
		{#if modelConfig?.provider.icon}
			{@const IconComponent = modelConfig.provider.icon}
			<IconComponent class="size-3" />
		{/if}
		<span>{getModelName(message.metadata?.model?.id || '')}</span>
	</div>
{/if}
