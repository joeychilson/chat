import IconAspectRatio from '~icons/tabler/aspect-ratio';
import IconBrain from '~icons/tabler/brain';
import IconMessage from '~icons/tabler/message-circle-cog';
import IconOpenAI from '~icons/simple-icons/openai';
import IconPalette from '~icons/tabler/palette';
import IconPhoto from '~icons/tabler/photo';
import IconSpeakerphone from '~icons/tabler/speakerphone';
import IconVolume from '~icons/tabler/volume';

import type { ModelProvider, ModelOption, ModelConfig } from '.';

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

export const summaryOption: ModelOption = {
	key: 'reasoningSummary',
	label: 'Summary',
	type: 'select',
	defaultValue: 'auto',
	options: [
		{ value: 'detailed', label: 'Detailed' },
		{ value: 'none', label: 'None' },
		{ value: 'auto', label: 'Auto' }
	],
	icon: IconMessage
};

export const imageQualityOption: ModelOption = {
	key: 'quality',
	label: 'Quality',
	type: 'select',
	defaultValue: 'auto',
	options: [
		{ value: 'low', label: 'Low' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'high', label: 'High' },
		{ value: 'auto', label: 'Auto' }
	],
	icon: IconPhoto
};

export const imageSizeOption: ModelOption = {
	key: 'size',
	label: 'Size',
	type: 'select',
	defaultValue: '1024x1024',
	options: [
		{ value: '1024x1024', label: '1024x1024' },
		{ value: '1024x1536', label: '1024x1536' },
		{ value: '1536x1024', label: '1536x1024' }
	],
	icon: IconAspectRatio
};

export const backgroundOption: ModelOption = {
	key: 'background',
	label: 'Background',
	type: 'select',
	defaultValue: 'auto',
	options: [
		{ value: 'transparent', label: 'Transparent' },
		{ value: 'opaque', label: 'Opaque' },
		{ value: 'auto', label: 'Auto' }
	],
	icon: IconPalette
};

export const speechVoiceOption: ModelOption = {
	key: 'voice',
	label: 'Voice',
	type: 'select',
	defaultValue: 'alloy',
	options: [
		{ value: 'alloy', label: 'Alloy' },
		{ value: 'echo', label: 'Echo' },
		{ value: 'fable', label: 'Fable' },
		{ value: 'onyx', label: 'Onyx' },
		{ value: 'nova', label: 'Nova' },
		{ value: 'shimmer', label: 'Shimmer' }
	],
	icon: IconSpeakerphone
};

export const speechSpeedOption: ModelOption = {
	key: 'speed',
	label: 'Speed',
	type: 'select',
	defaultValue: '1.0',
	options: [
		{ value: '0.25', label: '0.25x' },
		{ value: '0.5', label: '0.5x' },
		{ value: '0.75', label: '0.75x' },
		{ value: '1.0', label: '1.0x' },
		{ value: '1.25', label: '1.25x' },
		{ value: '1.5', label: '1.5x' },
		{ value: '2.0', label: '2.0x' },
		{ value: '4.0', label: '4.0x' }
	],
	icon: IconVolume
};

export const openaiProvider: ModelProvider = {
	id: 'openai',
	displayName: 'OpenAI',
	icon: IconOpenAI
};

export const models: ModelConfig[] = [
	{
		id: 'o4-mini-2025-04-16',
		type: 'text',
		name: 'o4-mini',
		provider: openaiProvider,
		availableOptions: [reasoningOption, summaryOption],
		supportedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
	},
	{
		id: 'gpt-4.1-2025-04-14',
		type: 'text',
		name: 'GPT-4.1',
		provider: openaiProvider,
		availableOptions: [],
		supportedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
	},
	{
		id: 'gpt-image-1',
		type: 'image',
		name: 'GPT Image 1',
		provider: openaiProvider,
		availableOptions: [imageQualityOption, imageSizeOption, backgroundOption],
		supportedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
	},
	{
		id: 'gpt-4o-mini-tts',
		type: 'speech',
		name: 'GPT-4o Mini TTS',
		provider: openaiProvider,
		availableOptions: [speechVoiceOption, speechSpeedOption],
		supportedFileTypes: []
	}
];
