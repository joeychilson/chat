<script lang="ts">
	import type { JSONValue } from 'ai';

	import IconAdjustmentsHorizontal from '~icons/tabler/adjustments-horizontal';
	import IconCheck from '~icons/tabler/check';

	import { Button } from '$lib/components/ui/button';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuSub,
		DropdownMenuSubContent,
		DropdownMenuSubTrigger,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { Switch } from '$lib/components/ui/switch';
	import { type Model, type ModelOption, models } from '$lib/models';

	interface Props {
		model: Model;
		onModelChange?: (model: Model) => void;
		disabled?: boolean;
	}

	let { model = $bindable(), onModelChange, disabled = false }: Props = $props();

	const modelConfig = $derived(models.find((m) => m.id === model.id));

	function updateOption(optionKey: string, value: JSONValue) {
		if (!model.options) {
			model.options = {};
		}
		const updatedModel: Model = {
			...model,
			options: {
				...model.options,
				[optionKey]: value
			}
		};
		model = updatedModel;
		onModelChange?.(updatedModel);
	}
</script>

{#if modelConfig?.availableOptions && modelConfig.availableOptions.length > 0}
	<DropdownMenu>
		<DropdownMenuTrigger>
			{#snippet child({ props })}
				<Button
					variant="outline"
					size="icon"
					{...props}
					{disabled}
					aria-label="Model options and settings"
				>
					<IconAdjustmentsHorizontal class="size-4" />
				</Button>
			{/snippet}
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end" class="w-64 p-0">
			<div class="border-b px-3 py-2">
				<h4 class="text-sm font-semibold">Model Options</h4>
				<p class="text-muted-foreground text-xs">
					Customize {modelConfig.name} behavior
				</p>
			</div>

			<div class="max-h-80 overflow-y-auto p-1">
				{#each modelConfig.availableOptions as option (option.key)}
					{#if option.type === 'toggle'}
						{@render toggleOption(option)}
					{:else if option.type === 'select'}
						{@render selectOption(option)}
					{/if}
				{/each}
			</div>
		</DropdownMenuContent>
	</DropdownMenu>
{/if}

{#snippet toggleOption(option: ModelOption)}
	{@const optionValue = model.options?.[option.key] ?? option.defaultValue}
	{@const checked = Boolean(optionValue)}

	<div class="group hover:bg-accent/50 flex h-12 items-center gap-3 rounded-md p-2">
		<div class="flex min-w-0 flex-1 items-center gap-3">
			{#if option.icon}
				<option.icon class="text-muted-foreground size-4 flex-shrink-0" />
			{/if}
			<div class="min-w-0 flex-1">
				<span class="text-foreground block text-sm font-medium">{option.label}</span>
				{#if option.description}
					<span class="text-muted-foreground block text-xs">{option.description}</span>
				{/if}
			</div>
		</div>
		<Switch {checked} onCheckedChange={(newChecked) => updateOption(option.key, newChecked)} />
	</div>
{/snippet}

{#snippet selectOption(option: ModelOption)}
	{@const selectedValue = String(model.options?.[option.key] ?? option.defaultValue)}
	{@const selectedOption = option.options?.find((opt) => String(opt.value) === selectedValue)}

	<DropdownMenuSub>
		<DropdownMenuSubTrigger class="group hover:bg-accent/50 h-12 gap-3 p-2">
			<div class="flex min-w-0 flex-1 items-center gap-3">
				{#if option.icon}
					<option.icon class="text-muted-foreground size-4 flex-shrink-0" />
				{/if}
				<div class="min-w-0 flex-1">
					<span class="text-foreground block text-sm font-medium">{option.label}</span>
					<span class="text-muted-foreground block text-xs">
						{selectedOption?.label || 'Select option'}
					</span>
				</div>
			</div>
		</DropdownMenuSubTrigger>
		<DropdownMenuSubContent class="w-48 p-1">
			{#each option.options || [] as optionItem (optionItem.value)}
				<div class="group hover:bg-accent/50 flex h-10 items-center gap-3 rounded-md p-2">
					<button
						class="min-w-0 flex-1 text-left"
						onclick={() => updateOption(option.key, optionItem.value)}
					>
						<span class="text-foreground hover:text-accent-foreground block text-sm">
							{optionItem.label}
						</span>
					</button>
					{#if selectedValue === String(optionItem.value)}
						<IconCheck class="text-primary size-4 flex-shrink-0" />
					{/if}
				</div>
			{/each}
		</DropdownMenuSubContent>
	</DropdownMenuSub>
{/snippet}
