<script lang="ts">
	import IconDots from '~icons/tabler/dots';
	import IconCoins from '~icons/tabler/coins';

	import AudioPlayer from '$lib/components/audio-player';
	import Markdown from '$lib/components/markdown';
	import { Button } from '$lib/components/ui/button';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import type { Message } from '$lib/messages';
	import { getModelName, getModelConfig } from '$lib/models';
	import { formatDuration } from '$lib/utils/time';

	import MessageActions from './messages-actions.svelte';
	import MessageEditor from './messages-editor.svelte';
	import MessageReasoning from './messages-reasoning.svelte';
	import MessageSources from './messages-sources.svelte';

	interface Props {
		status: 'streaming' | 'submitted' | 'ready' | 'error';
		message: Message;
		retry: (message: Message) => Promise<void>;
		updateMessage: (messageId: string, updatedParts: Message['parts']) => void;
		lastMessage?: boolean;
	}

	let { status, message, retry, updateMessage, lastMessage = false }: Props = $props();

	let editing = $state(false);

	let modelConfig = $derived(
		message.metadata?.model?.id ? getModelConfig(message.metadata.model.id) : undefined
	);
</script>

<div class="mb-4 flex justify-start">
	<div class="w-full max-w-3xl">
		<div class="group">
			<div class="overflow-x-auto">
				{#if editing}
					<MessageEditor {message} bind:editing />
				{:else}
					{#each message.parts as part, i (`${message.id}-${i}`)}
						{#if part.type === 'reasoning'}
							<MessageReasoning
								text={part.text}
								isLoading={status === 'streaming' && lastMessage}
							/>
						{:else if part.type === 'text'}
							<div class="max-w-none text-left">
								<Markdown source={part.text} />
							</div>
						{:else if part.type === 'file'}
							<div class="max-w-none text-left">
								{#if part.mediaType.startsWith('image/')}
									<div class="group/image relative">
										<img
											alt=""
											src={part.url}
											class="max-h-96 w-auto max-w-full rounded-md border object-contain sm:h-96"
										/>
									</div>
								{:else if part.mediaType.startsWith('audio/')}
									<AudioPlayer file={part} {message} />
								{/if}
							</div>
						{/if}
					{/each}
				{/if}
			</div>
			<MessageSources parts={message.parts.filter((part) => part.type === 'source-url')} />
			<div class="mt-2 flex items-center justify-between">
				<div class="flex items-center gap-1">
					{#if status === 'streaming' && lastMessage}
						<div aria-live="polite" aria-label="AI is generating response">
							<IconDots class="size-5 animate-pulse" />
						</div>
					{:else if message.parts.length > 0}
						<MessageActions {status} {message} {retry} {updateMessage} bind:editing />
					{/if}
				</div>
				<div class="flex items-center gap-1">
					{#if message.metadata}
						{#if message.metadata.model && message.metadata.duration}
							<div class="text-muted-foreground flex items-center gap-1 text-xs">
								{#if modelConfig?.availableOptions && modelConfig.availableOptions.length > 0}
									<Popover>
										<PopoverTrigger>
											{#snippet child({ props })}
												<button
													{...props}
													class="hover:text-foreground flex cursor-pointer items-center gap-1 underline decoration-dotted underline-offset-2 transition-colors"
													aria-label="View model options for {getModelName(
														message.metadata?.model?.id || ''
													)}"
												>
													{#if modelConfig?.provider.icon}
														{@const IconComponent = modelConfig.provider.icon}
														<IconComponent class="size-3" />
													{/if}
													{getModelName(message.metadata?.model?.id || '')}
												</button>
											{/snippet}
										</PopoverTrigger>
										<PopoverContent side="top" align="start" class="w-auto p-3">
											<div class="space-y-3">
												<div class="flex items-center gap-2">
													<h3 class="text-sm font-semibold">Model Options</h3>
												</div>
												<div class="space-y-2">
													{#each modelConfig?.availableOptions || [] as option (option.key)}
														{@const currentValue =
															message.metadata?.model?.options?.[option.key] ?? option.defaultValue}
														<div class="flex items-center justify-between gap-4">
															<span class="text-muted-foreground text-xs">{option.label}:</span>
															<span class="font-mono text-xs font-medium">
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
								<span>in {formatDuration(message.metadata.duration)}</span>
							</div>
						{/if}
						{#if message.metadata.usage}
							<Popover>
								<PopoverTrigger>
									{#snippet child({ props })}
										<Button
											variant="ghost"
											size="sm"
											{...props}
											aria-label="View token usage details"
										>
											<IconCoins class="text-muted-foreground size-4" />
										</Button>
									{/snippet}
								</PopoverTrigger>
								<PopoverContent side="top" align="end" class="w-auto p-2">
									<div class="space-y-2">
										<div class="flex items-center gap-2">
											<IconCoins class="text-muted-foreground size-4" />
											<h3 class="text-sm font-semibold">Token Usage</h3>
										</div>
										<div class="space-y-2">
											<div class="flex items-center justify-between">
												<span class="text-muted-foreground text-xs">Input:</span>
												<span class="font-mono text-xs font-medium"
													>{message.metadata.usage.inputTokens?.toLocaleString()}</span
												>
											</div>
											{#if message.metadata.usage.cachedTokens}
												<div class="flex items-center justify-between">
													<span class="text-muted-foreground text-xs">Cached:</span>
													<span class="font-mono text-xs font-medium"
														>{message.metadata.usage.cachedTokens?.toLocaleString()}</span
													>
												</div>
											{/if}
											{#if message.metadata.usage.reasoningTokens}
												<div class="flex items-center justify-between">
													<span class="text-muted-foreground text-xs">Reasoning:</span>
													<span class="font-mono text-xs font-medium"
														>{message.metadata.usage.reasoningTokens?.toLocaleString()}</span
													>
												</div>
											{/if}
											<div class="flex items-center justify-between">
												<span class="text-muted-foreground text-xs">Output:</span>
												<span class="font-mono text-xs font-medium"
													>{message.metadata.usage.outputTokens?.toLocaleString()}</span
												>
											</div>

											<div class="flex items-center justify-between">
												<span class="text-xs font-semibold">Total:</span>
												<span class="font-mono text-xs font-bold"
													>{message.metadata.usage.totalTokens?.toLocaleString()}</span
												>
											</div>
										</div>
									</div>
								</PopoverContent>
							</Popover>
						{/if}
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
