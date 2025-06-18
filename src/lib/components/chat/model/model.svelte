<script lang="ts">
	import type { Model as ModelType } from '$lib/models';

	import ModelOptions from './model-options.svelte';
	import ModelSelector from './model-selector.svelte';

	let { model = $bindable() }: { model: ModelType } = $props();
</script>

<div class="flex items-center gap-2" role="group" aria-label="Model selection">
	<ModelOptions bind:model />
	<ModelSelector bind:model />
</div>
