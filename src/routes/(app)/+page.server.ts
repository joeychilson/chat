import { randomUUID } from 'crypto';

import type { JSONValue } from 'ai';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

import { defaultModel, getModelConfig } from '$lib/models';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.session || !locals.user) {
		throw redirect(302, '/signin');
	}

	const userDefaultModel = locals.session.settings?.defaultModel || defaultModel;

	const titleParam = url.searchParams.get('title');
	const modelParam = url.searchParams.get('model');
	const promptParam = url.searchParams.get('prompt');

	const modelOptions: Record<string, JSONValue> = {};
	for (const [key, value] of url.searchParams.entries()) {
		if (key !== 'title' && key !== 'model' && key !== 'prompt') {
			if (value === 'true') {
				modelOptions[key] = true;
			} else if (value === 'false') {
				modelOptions[key] = false;
			} else if (!isNaN(Number(value))) {
				modelOptions[key] = Number(value);
			} else {
				modelOptions[key] = value;
			}
		}
	}

	let selectedModel = userDefaultModel;
	if (modelParam) {
		const modelConfig = getModelConfig(modelParam);
		if (modelConfig) {
			selectedModel = {
				id: modelParam,
				type: modelConfig.type,
				options: Object.keys(modelOptions).length > 0 ? modelOptions : {}
			};
		}
	}

	return {
		currentChat: {
			id: randomUUID(),
			model: selectedModel,
			messages: [],
			title: titleParam || undefined,
			prompt: promptParam || undefined
		}
	};
};
