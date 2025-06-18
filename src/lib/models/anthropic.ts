import IconClaude from '~icons/simple-icons/claude';
import IconBrain from '~icons/tabler/brain';

import type { ModelProvider, ModelOption, ModelConfig } from '.';

export const thinkingOption: ModelOption = {
	key: 'thinking',
	label: 'Thinking',
	description: 'Allows the model to think.',
	type: 'toggle',
	defaultValue: false,
	icon: IconBrain
};

export const anthropicProvider: ModelProvider = {
	id: 'anthropic',
	displayName: 'Anthropic',
	icon: IconClaude
};

export const models: ModelConfig[] = [
	{
		id: 'claude-sonnet-4-20250514',
		name: 'Claude Sonnet 4',
		type: 'text',
		provider: anthropicProvider,
		availableOptions: [thinkingOption],
		supportedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
	}
];
