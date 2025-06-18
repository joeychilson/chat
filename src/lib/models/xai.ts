import IconXAI from '~icons/simple-icons/x';
import IconBrain from '~icons/tabler/brain';

import type { ModelProvider, ModelConfig, ModelOption } from '.';

export const reasoningOption: ModelOption = {
	key: 'reasoning',
	label: 'Reasoning',
	type: 'select',
	defaultValue: 'low',
	options: [
		{ value: 'low', label: 'Low' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'high', label: 'High' }
	],
	icon: IconBrain
};

export const xaiProvider: ModelProvider = {
	id: 'xai',
	displayName: 'xAI',
	icon: IconXAI
};

export const models: ModelConfig[] = [
	{
		id: 'grok-3',
		type: 'text',
		name: 'Grok 3',
		provider: xaiProvider,
		availableOptions: [],
		supportedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
	},
	{
		id: 'grok-3-mini',
		type: 'text',
		name: 'Grok 3 Mini',
		provider: xaiProvider,
		availableOptions: [reasoningOption],
		supportedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
	},
	{
		id: 'grok-2-image',
		type: 'image',
		name: 'Grok 2 Image',
		provider: xaiProvider,
		availableOptions: [],
		supportedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
	}
];
