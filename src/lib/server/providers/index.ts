import { type Model, models } from '$lib/models';

import anthropic from './anthropic';
import google from './google';
import openai from './openai';
import xai from './xai';

export function getTextModelProvider(model: Model) {
	const baseModel = models.find((m) => m.id === model.id);
	if (!baseModel) {
		throw new Error(`Model with id "${model.id}" not found`);
	}

	const providerId = baseModel.provider.id;

	switch (providerId) {
		case 'anthropic':
			return {
				provider: anthropic,
				modelId: model.id
			};
		case 'google':
			return {
				provider: google,
				modelId: model.id
			};
		case 'openai':
			return {
				provider: openai.responses,
				modelId: model.id
			};
		case 'xai':
			return {
				provider: xai,
				modelId: model.id
			};
		default:
			throw new Error(`Unsupported provider for text generation: ${providerId}`);
	}
}

export function getImageModelProvider(model: Model) {
	const baseModel = models.find((m) => m.id === model.id);
	if (!baseModel) {
		throw new Error(`Model with id "${model.id}" not found`);
	}

	const providerId = baseModel.provider.id;

	switch (providerId) {
		case 'openai':
			return {
				provider: openai.imageModel,
				modelId: model.id
			};
		case 'xai':
			return {
				provider: xai.imageModel,
				modelId: model.id
			};
		default:
			throw new Error(`Unsupported provider for image generation: ${providerId}`);
	}
}

export function getSpeechModelProvider(model: Model) {
	const baseModel = models.find((m) => m.id === model.id);
	if (!baseModel) {
		throw new Error(`Model with id "${model.id}" not found`);
	}

	const providerId = baseModel.provider.id;

	switch (providerId) {
		case 'openai':
			return {
				provider: openai.speech,
				modelId: model.id
			};
		default:
			throw new Error(`Unsupported provider for speech generation: ${providerId}`);
	}
}
