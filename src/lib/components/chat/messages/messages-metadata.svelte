<script lang="ts">
	import IconInfoCircle from '~icons/tabler/info-circle';

	import { Button } from '$lib/components/ui/button';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import type { Message } from '$lib/messages';
	import { formatDuration, timeAgo } from '$lib/utils/time';

	let { message }: { message: Message } = $props();
</script>

<Popover>
	<PopoverTrigger>
		{#snippet child({ props })}
			<Button variant="ghost" size="sm" {...props} aria-label="View message information">
				<IconInfoCircle class="text-muted-foreground size-4" />
			</Button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent side="top" align="end" class="w-72 max-w-[calc(100vw-1rem)] p-4 sm:w-56 sm:p-3">
		<div class="space-y-3">
			<div class="flex items-center gap-2">
				<IconInfoCircle class="text-muted-foreground size-4" />
				<h3 class="text-sm font-medium">Message Info</h3>
			</div>

			<div class="grid gap-3 text-sm sm:gap-2">
				{#if message.metadata?.createdAt}
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Created</span>
						<span class="font-medium">{timeAgo(new Date(message.metadata.createdAt))}</span>
					</div>
				{/if}

				{#if message.metadata?.duration}
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Duration</span>
						<span class="font-medium">{formatDuration(message.metadata.duration)}</span>
					</div>
				{/if}

				{#if message.metadata?.usage}
					<div class="space-y-2 border-t pt-3 sm:space-y-1.5 sm:pt-2">
						<div class="flex items-center justify-between">
							<span class="text-muted-foreground">Input tokens</span>
							<span class="font-mono font-medium"
								>{message.metadata.usage.inputTokens?.toLocaleString()}</span
							>
						</div>

						{#if message.metadata.usage.reasoningTokens}
							<div class="flex items-center justify-between">
								<span class="text-muted-foreground">Reasoning tokens</span>
								<span class="font-mono font-medium"
									>{message.metadata.usage.reasoningTokens?.toLocaleString()}</span
								>
							</div>
						{/if}

						<div class="flex items-center justify-between">
							<span class="text-muted-foreground">Output tokens</span>
							<span class="font-mono font-medium"
								>{message.metadata.usage.outputTokens?.toLocaleString()}</span
							>
						</div>

						<div
							class="mt-2 flex items-center justify-between border-t pt-2 font-medium sm:mt-1.5 sm:pt-1.5"
						>
							<span>Total tokens</span>
							<span class="font-mono">{message.metadata.usage.totalTokens?.toLocaleString()}</span>
						</div>

						{#if message.metadata.usage.totalTokens && message.metadata.duration}
							<div class="flex items-center justify-between">
								<span class="text-muted-foreground">Speed</span>
								<span class="font-mono font-medium"
									>{Math.round(
										(message.metadata.usage.totalTokens / message.metadata.duration) * 1000
									).toLocaleString()} tok/s</span
								>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</PopoverContent>
</Popover>
