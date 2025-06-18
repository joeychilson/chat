<script lang="ts">
	import IconChevronDown from '~icons/tabler/chevron-down';
	import IconCheck from '~icons/tabler/check';

	import { Button } from '$lib/components/ui/button';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
		DropdownMenuSeparator,
		DropdownMenuLabel
	} from '$lib/components/ui/dropdown-menu';
	import { type Model, models, type ModelConfig } from '$lib/models';

	interface Props {
		model: Model;
		onModelChange?: (model: Model) => void;
		disabled?: boolean;
	}

	let { model = $bindable(), onModelChange, disabled = false }: Props = $props();

	const modelConfig = $derived(models.find((m) => m.id === model.id));

	const textModels = $derived(models.filter((model) => model.type === 'text'));
	const imageModels = $derived(models.filter((model) => model.type === 'image'));
	const speechModels = $derived(models.filter((model) => model.type === 'speech'));

	function selectModel(selectedModel: ModelConfig) {
		const newModel: Model = {
			id: selectedModel.id,
			type: selectedModel.type,
			options: {}
		};
		model = newModel;
		onModelChange?.(newModel);
	}
</script>

<DropdownMenu>
	<DropdownMenuTrigger>
		{#snippet child({ props })}
			<Button
				variant="outline"
				class="min-w-[200px] justify-between"
				aria-label="Select AI model: {modelConfig?.name}"
				{...props}
				{disabled}
			>
				<div class="flex items-center gap-2">
					{#if modelConfig?.provider.icon}
						<modelConfig.provider.icon class="size-4" aria-hidden="true" />
					{/if}
					<span>{modelConfig?.name}</span>
				</div>
				<IconChevronDown class="size-4 shrink-0" aria-hidden="true" />
			</Button>
		{/snippet}
	</DropdownMenuTrigger>
	<DropdownMenuContent align="start" class="w-52">
		{#if textModels.length > 0}
			<DropdownMenuLabel>Text Models</DropdownMenuLabel>
			{#each textModels as textModel (textModel.id)}
				<DropdownMenuItem class="flex items-center gap-2" onclick={() => selectModel(textModel)}>
					{#if textModel.provider.icon}
						<textModel.provider.icon class="size-4" aria-hidden="true" />
					{/if}
					<div class="flex flex-1 flex-col">
						<span class="text-sm">{textModel.name}</span>
						<span class="text-muted-foreground text-xs">{textModel.provider.displayName}</span>
					</div>
					{#if textModel.id === model.id}
						<IconCheck class="size-4" aria-label="Currently selected" />
					{/if}
				</DropdownMenuItem>
			{/each}
		{/if}

		{#if imageModels.length > 0 && textModels.length > 0}
			<DropdownMenuSeparator />
		{/if}

		{#if imageModels.length > 0}
			<DropdownMenuLabel>Image Models</DropdownMenuLabel>
			{#each imageModels as imageModel (imageModel.id)}
				<DropdownMenuItem class="flex items-center gap-2" onclick={() => selectModel(imageModel)}>
					{#if imageModel.provider.icon}
						<imageModel.provider.icon class="size-4" aria-hidden="true" />
					{/if}
					<div class="flex flex-1 flex-col">
						<span class="text-sm">{imageModel.name}</span>
						<span class="text-muted-foreground text-xs">{imageModel.provider.displayName}</span>
					</div>
					{#if imageModel.id === model.id}
						<IconCheck class="size-4" aria-label="Currently selected" />
					{/if}
				</DropdownMenuItem>
			{/each}
		{/if}

		{#if speechModels.length > 0 && (textModels.length > 0 || imageModels.length > 0)}
			<DropdownMenuSeparator />
		{/if}

		{#if speechModels.length > 0}
			<DropdownMenuLabel>Speech Models</DropdownMenuLabel>
			{#each speechModels as speechModel (speechModel.id)}
				<DropdownMenuItem class="flex items-center gap-2" onclick={() => selectModel(speechModel)}>
					{#if speechModel.provider.icon}
						<speechModel.provider.icon class="size-4" aria-hidden="true" />
					{/if}
					<div class="flex flex-1 flex-col">
						<span class="text-sm">{speechModel.name}</span>
						<span class="text-muted-foreground text-xs">{speechModel.provider.displayName}</span>
					</div>
					{#if speechModel.id === model.id}
						<IconCheck class="size-4" aria-label="Currently selected" />
					{/if}
				</DropdownMenuItem>
			{/each}
		{/if}
	</DropdownMenuContent>
</DropdownMenu>
