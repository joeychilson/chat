import IconGemini from '~icons/simple-icons/googlegemini';
import IconBrain from '~icons/tabler/brain';
import IconSearch from '~icons/tabler/search';

import type { ModelProvider, ModelOption, ModelConfig } from '.';

export const googleProvider: ModelProvider = {
	id: 'google',
	displayName: 'Google',
	icon: IconGemini
};

export const thinkingOption: ModelOption = {
	key: 'thinking',
	label: 'Thinking',
	description: 'Allows the model to think.',
	type: 'toggle',
	defaultValue: false,
	icon: IconBrain
};

export const searchOption: ModelOption = {
	key: 'search',
	label: 'Search',
	description: 'Allows the model to search.',
	type: 'toggle',
	defaultValue: false,
	icon: IconSearch
};

export const models: ModelConfig[] = [
	{
		id: 'gemini-2.5-flash-preview-05-20',
		type: 'text',
		name: 'Gemini 2.5 Flash',
		provider: googleProvider,
		availableOptions: [thinkingOption, searchOption],
		supportedFileTypes: [
			'audio/mpeg',
			'audio/wav',
			'audio/ogg',
			'audio/aiff',
			'audio/aac',
			'audio/flac',
			'image/jpeg',
			'image/png',
			'image/heic',
			'image/heif',
			'image/webp',
			'video/mp4',
			'video/webm',
			'video/mov',
			'video/avi',
			'video/x-flv',
			'video/mpg',
			'video/wmv',
			'video/3gpp',
			'application/pdf',
			'text/plain',
			'text/html',
			'text/css',
			'text/javascript',
			'text/markdown',
			'text/csv',
			'text/xml',
			'text/python'
		]
	},
	{
		id: 'gemini-2.5-pro-preview-06-05',
		type: 'text',
		name: 'Gemini 2.5 Pro',
		provider: googleProvider,
		availableOptions: [thinkingOption, searchOption],
		supportedFileTypes: [
			'audio/mpeg',
			'audio/wav',
			'audio/ogg',
			'audio/aiff',
			'audio/aac',
			'audio/flac',
			'image/jpeg',
			'image/png',
			'image/heic',
			'image/heif',
			'image/webp',
			'video/mp4',
			'video/webm',
			'video/mov',
			'video/avi',
			'video/x-flv',
			'video/mpg',
			'video/wmv',
			'video/3gpp',
			'application/pdf',
			'text/plain',
			'text/html',
			'text/css',
			'text/javascript',
			'text/markdown',
			'text/csv',
			'text/xml',
			'text/python'
		]
	}
];
