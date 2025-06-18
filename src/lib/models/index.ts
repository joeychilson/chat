import type { Component } from 'svelte';

import type { JSONValue } from 'ai';
import type { AllowedFileType } from '$lib/files';

import { models as anthropicModels } from './anthropic';
import { models as googleModels } from './google';
import { models as openAIModels } from './openai';
import { models as xaiModels } from './xai';

export const defaultModel = {
	id: 'gemini-2.5-flash-preview-05-20',
	type: 'text' as const,
	options: {}
};

export interface Model {
	id: string;
	type: 'text' | 'image' | 'speech';
	options?: Record<string, JSONValue>;
}

export interface ModelProvider {
	id: string;
	displayName: string;
	icon?: Component;
}

export interface ModelOption {
	key: string;
	label: string;
	description?: string;
	type: 'select' | 'toggle';
	defaultValue: JSONValue;
	options?: Array<{ value: JSONValue; label: string }>;
	icon?: Component;
}

export interface ModelConfig {
	id: string;
	name: string;
	type: 'text' | 'image' | 'speech';
	provider: ModelProvider;
	availableOptions?: ModelOption[];
	selectedOptions?: Record<string, JSONValue>;
	supportedFileTypes?: readonly AllowedFileType[];
}

export type ProviderOptions = Record<string, Record<string, JSONValue>>;

export const models = [...anthropicModels, ...googleModels, ...openAIModels, ...xaiModels];

export function modelToProviderOptions(model: Model): ProviderOptions {
	const providerOptions: ProviderOptions = {};

	if (!model.options) {
		return providerOptions;
	}

	const baseModel = models.find((m) => m.id === model.id);
	if (!baseModel) {
		throw new Error(`Model with id "${model.id}" not found`);
	}

	const providerId = baseModel.provider.id;

	switch (providerId) {
		case 'anthropic': {
			const anthropicOptions: Record<string, JSONValue> = {};

			// Chat model options
			if (model.options.thinking !== undefined && model.options.thinking === true) {
				anthropicOptions.thinking = {
					type: 'enabled',
					budgetTokens: 12000
				};
			}
			if (Object.keys(anthropicOptions).length > 0) {
				providerOptions.anthropic = anthropicOptions;
			}
			break;
		}

		case 'google': {
			const googleOptions: Record<string, JSONValue> = {};
			if (model.options.thinking !== undefined && model.options.thinking === true) {
				googleOptions.thinkingConfig = {
					thinkingBudget: 2048
				};
			}
			if (model.options.search !== undefined && model.options.search === true) {
				googleOptions.useSearchGrounding = true;
			}
			if (Object.keys(googleOptions).length > 0) {
				providerOptions.google = googleOptions;
			}
			break;
		}

		case 'openai': {
			const openaiOptions: Record<string, JSONValue> = {};

			// Chat model options
			if (model.options.reasoning !== undefined) {
				openaiOptions.reasoning = model.options.reasoning;
			}
			if (
				model.options.reasoningSummary !== undefined &&
				model.options.reasoningSummary !== 'none'
			) {
				openaiOptions.reasoningSummary = model.options.reasoningSummary;
			}

			// Image model options
			if (model.options.quality !== undefined && model.options.quality !== 'auto') {
				openaiOptions.quality = model.options.quality;
			}
			if (model.options.background !== undefined && model.options.background !== 'auto') {
				openaiOptions.background = model.options.background;
			}

			if (Object.keys(openaiOptions).length > 0) {
				providerOptions.openai = openaiOptions;
			}
			break;
		}

		case 'xai': {
			const xaiOptions: Record<string, JSONValue> = {};

			if (model.options.reasoning !== undefined) {
				xaiOptions.reasoningEffort = model.options.reasoning;
			}
			if (Object.keys(xaiOptions).length > 0) {
				providerOptions.xai = xaiOptions;
			}
			break;
		}
	}

	return providerOptions;
}

export function getModelName(modelId: string): string {
	const model = models.find((m) => m.id === modelId);
	return model?.name || modelId;
}

export function getModelConfig(modelId: string): ModelConfig | undefined {
	return models.find((m) => m.id === modelId);
}
