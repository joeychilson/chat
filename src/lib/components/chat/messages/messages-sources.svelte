<script lang="ts">
	import { slide } from 'svelte/transition';

	import IconChevronDown from '~icons/tabler/chevron-down';
	import IconLink from '~icons/tabler/link';
	import IconGlobe from '~icons/tabler/globe';

	import { Button } from '$lib/components/ui/button';
	import type { SourceUrlUIPart } from 'ai';

	let { parts }: { parts: SourceUrlUIPart[] } = $props();

	let isExpanded = $state(false);
	let faviconErrors = $state(new Set<string>());

	function handleFaviconError(sourceId: string) {
		faviconErrors.add(sourceId);
		faviconErrors = faviconErrors;
	}

	function getFaviconUrl(url: string): string {
		try {
			const domain = new URL(url).hostname;
			return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
		} catch {
			return '';
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			isExpanded = !isExpanded;
		}
	}
</script>

{#if parts.length > 0}
	<div class="mt-2 flex flex-col gap-2">
		<Button
			variant="ghost"
			size="sm"
			class="text-muted-foreground h-auto w-fit justify-start p-1 text-sm"
			onclick={() => (isExpanded = !isExpanded)}
			onkeydown={handleKeydown}
			aria-expanded={isExpanded}
			aria-controls="sources-list"
			aria-label="{isExpanded ? 'Hide' : 'Show'} {parts.length} source{parts.length === 1
				? ''
				: 's'}"
		>
			<span class="inline-flex items-center gap-1">
				<IconLink class="size-4" aria-hidden="true" />
				Sources ({parts.length})
			</span>
			<IconChevronDown
				class="ml-1 size-3 transition-transform {isExpanded ? '' : 'rotate-180'}"
				aria-hidden="true"
			/>
		</Button>

		{#if isExpanded}
			<div
				transition:slide={{ duration: 300 }}
				id="sources-list"
				role="region"
				aria-label="Source links"
			>
				<div class="space-y-1">
					{#each parts as part (part.sourceId)}
						{@const faviconUrl = getFaviconUrl(part.url)}
						{@const showFallback = faviconErrors.has(part.sourceId) || !faviconUrl}
						<a
							href={part.url}
							target="_blank"
							rel="noopener noreferrer"
							class="text-muted-foreground hover:text-foreground focus:ring-ring flex items-center gap-2 rounded-sm py-1 text-sm transition-colors hover:underline focus:ring-1 focus:ring-offset-1 focus:outline-none"
							aria-label="Open {part.title} in new tab"
						>
							<div class="flex-shrink-0">
								{#if showFallback}
									<IconGlobe class="size-3.5 opacity-60" aria-hidden="true" />
								{:else}
									<img
										src={faviconUrl}
										alt=""
										class="size-3.5 opacity-60"
										loading="lazy"
										onerror={() => handleFaviconError(part.sourceId)}
									/>
								{/if}
							</div>
							<span class="truncate">{part.title || new URL(part.url).hostname}</span>
						</a>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}
