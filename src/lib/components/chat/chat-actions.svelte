<script lang="ts">
	import IconNews from '~icons/tabler/news';
	import IconCode from '~icons/tabler/code';
	import IconHelp from '~icons/tabler/help';
	import IconBook from '~icons/tabler/book';
	import IconMagic from '~icons/tabler/sparkles';

	import { Button } from '$lib/components/ui/button';
	import { getToday } from '$lib/utils/time';
	import type { Model } from '$lib/models';

	interface Props {
		onPromptSelect: (prompt: string, model?: Model) => void;
	}

	let { onPromptSelect }: Props = $props();

	interface PromptAction {
		label: string;
		prompt: string;
		model?: Model;
	}

	interface Category {
		name: string;
		icon: typeof IconNews;
		prompts: PromptAction[];
	}

	let activeCategory = $state('Try it out');

	const categories: Category[] = [
		{
			name: 'Try it out',
			icon: IconNews,
			prompts: [
				{
					label: `What's the latest news for ${getToday()}?`,
					prompt: `What's the latest news for ${getToday()}?`,
					model: {
						id: 'gemini-2.5-flash-preview-05-20',
						type: 'text',
						options: { search: true }
					}
				},
				{
					label: 'Generate an image of a cat and a dog as friends',
					prompt: 'Generate an image of a cat and a dog as friends',
					model: {
						id: 'gpt-image-1',
						type: 'image'
					}
				},
				{
					label: 'Show me why Go is a great language with a code example!',
					prompt: 'Show me why Go is a great language with a code example!',
					model: {
						id: 'claude-sonnet-4-20250514',
						type: 'text',
						options: { thinking: true }
					}
				},
				{
					label: 'What is the weather in Tokyo?',
					prompt: 'What is the weather in Tokyo?',
					model: {
						id: 'gemini-2.5-flash-preview-05-20',
						type: 'text',
						options: { search: true }
					}
				},
				{
					label: "What's the best thing about Switzerland? The flag is a big plus.",
					prompt: "What's the best thing about Switzerland? The flag is a big plus.",
					model: {
						id: 'gpt-4o-mini-tts',
						type: 'speech',
						options: { voice: 'onyx', speed: 1 }
					}
				}
			]
		},
		{
			name: 'Create',
			icon: IconMagic,
			prompts: [
				{
					label: 'Write a short story about a robot discovering emotions',
					prompt: 'Write a short story about a robot discovering emotions'
				},
				{
					label: 'Help me outline a sci-fi novel set in a post-apocalyptic world',
					prompt: 'Help me outline a sci-fi novel set in a post-apocalyptic world'
				},
				{
					label: 'Create a character profile for a complex villain with sympathetic motives',
					prompt: 'Create a character profile for a complex villain with sympathetic motives'
				},
				{
					label: 'Give me 5 creative writing prompts for flash fiction',
					prompt: 'Give me 5 creative writing prompts for flash fiction'
				},
				{
					label: 'Generate a poem about the ocean at sunset',
					prompt: 'Generate a poem about the ocean at sunset'
				}
			]
		},
		{
			name: 'Explore',
			icon: IconBook,
			prompts: [
				{
					label: 'Good books for fans of Rick Rubin',
					prompt: 'Good books for fans of Rick Rubin',
					model: {
						id: 'gemini-2.5-flash-preview-05-20',
						type: 'text',
						options: { search: true }
					}
				},
				{
					label: 'Countries ranked by number of corgis',
					prompt: 'Countries ranked by number of corgis',
					model: {
						id: 'gemini-2.5-flash-preview-05-20',
						type: 'text',
						options: { search: true }
					}
				},
				{
					label: 'Most successful companies in the world',
					prompt: 'Most successful companies in the world',
					model: {
						id: 'gemini-2.5-flash-preview-05-20',
						type: 'text',
						options: { search: true }
					}
				},
				{
					label: 'How does AI work?',
					prompt: 'How does AI work?'
				},
				{
					label: 'Are black holes real?',
					prompt: 'Are black holes real?'
				}
			]
		},
		{
			name: 'Code',
			icon: IconCode,
			prompts: [
				{
					label: 'Write code to invert a binary search tree in Python',
					prompt: 'Write code to invert a binary search tree in Python',
					model: {
						id: 'claude-sonnet-4-20250514',
						type: 'text',
						options: { thinking: true }
					}
				},
				{
					label: "What's the difference between Promise.all and Promise.allSettled?",
					prompt: "What's the difference between Promise.all and Promise.allSettled?",
					model: {
						id: 'claude-sonnet-4-20250514',
						type: 'text',
						options: { thinking: true }
					}
				},
				{
					label: "Explain React's useEffect cleanup function",
					prompt: "Explain React's useEffect cleanup function",
					model: {
						id: 'claude-sonnet-4-20250514',
						type: 'text',
						options: { thinking: true }
					}
				},
				{
					label: 'Best practices for error handling in async/await',
					prompt: 'Best practices for error handling in async/await',
					model: {
						id: 'claude-sonnet-4-20250514',
						type: 'text',
						options: { thinking: true }
					}
				},
				{
					label: 'Debug this JavaScript code snippet',
					prompt: 'Debug this JavaScript code snippet',
					model: {
						id: 'claude-sonnet-4-20250514',
						type: 'text',
						options: { thinking: true }
					}
				}
			]
		},
		{
			name: 'Learn',
			icon: IconHelp,
			prompts: [
				{
					label: "Beginner's guide to TypeScript",
					prompt: "Beginner's guide to TypeScript"
				},
				{
					label: 'Explain the CAP theorem in distributed systems',
					prompt: 'Explain the CAP theorem in distributed systems'
				},
				{
					label: 'Why is AI so expensive?',
					prompt: 'Why is AI so expensive?'
				},
				{
					label: 'Are black holes real?',
					prompt: 'Are black holes real?'
				},
				{
					label: 'How do quantum computers work?',
					prompt: 'How do quantum computers work?'
				}
			]
		}
	];

	const currentCategoryPrompts = $derived(() => {
		const category = categories.find((c) => c.name === activeCategory);
		return category?.prompts || [];
	});

	function handleAction(action: PromptAction) {
		onPromptSelect(action.prompt, action.model);
	}
</script>

<div class="w-full">
	<div class="mb-8 flex justify-center gap-2">
		{#each categories as category (category.name)}
			<Button
				variant={activeCategory === category.name ? 'secondary' : 'ghost'}
				size="sm"
				class="gap-1.5"
				onclick={() => (activeCategory = category.name)}
			>
				<category.icon class="size-4" />
				{category.name}
			</Button>
		{/each}
	</div>

	<div class="mx-auto w-full max-w-2xl">
		<div class="flex flex-col gap-1">
			{#each currentCategoryPrompts() as prompt, i (i)}
				<button
					class="hover:bg-muted/50 text-muted-foreground hover:text-foreground w-full rounded-lg px-4 py-3 text-left text-sm transition-colors"
					onclick={() => handleAction(prompt)}
				>
					{prompt.label}
				</button>
			{/each}
		</div>
	</div>
</div>
