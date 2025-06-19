import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';

import db from '$lib/server/db';
import { settingsTable, type SettingsInsert } from '$lib/server/db/schema';
import type { Model } from '$lib/models';

export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.session || !locals.user) {
		error(401, { message: 'You must be signed in to update your settings.' });
	}
	const userId = locals.user.id;

	let defaultModel: Model | undefined;
	let defaultSpeechVoice: string | undefined;
	let defaultSpeechSpeed: string | undefined;
	let preferredName: string | undefined;
	let userRole: string | undefined;
	let assistantTraits: string[] | undefined;
	let additionalContext: string | undefined;

	try {
		const body = await request.json();

		if (body.defaultModel) {
			if (!body.defaultModel.id || typeof body.defaultModel.id !== 'string') {
				error(400, { message: 'Please provide a valid model.' });
			}
			defaultModel = body.defaultModel;
		}

		if (body.defaultSpeechVoice !== undefined) {
			defaultSpeechVoice = body.defaultSpeechVoice;
		}

		if (body.defaultSpeechSpeed !== undefined) {
			defaultSpeechSpeed = body.defaultSpeechSpeed;
		}

		if (body.preferredName !== undefined) {
			preferredName = body.preferredName;
		}

		if (body.userRole !== undefined) {
			userRole = body.userRole;
		}

		if (body.assistantTraits !== undefined) {
			assistantTraits = body.assistantTraits;
		}

		if (body.additionalContext !== undefined) {
			additionalContext = body.additionalContext;
		}

		if (
			!defaultModel &&
			defaultSpeechVoice === undefined &&
			defaultSpeechSpeed === undefined &&
			preferredName === undefined &&
			userRole === undefined &&
			assistantTraits === undefined &&
			additionalContext === undefined
		) {
			error(400, { message: 'No settings provided to update.' });
		}
	} catch (err) {
		console.error('Failed to parse settings update request', { userId, cause: err });
		error(400, { message: "We couldn't process your request. Please try again." });
	}

	try {
		const values: SettingsInsert = { userId };
		const updateSet: Record<string, unknown> = { updatedAt: new Date() };

		if (defaultModel) {
			values.defaultModel = defaultModel;
			updateSet.defaultModel = defaultModel;
		}
		if (defaultSpeechVoice !== undefined) {
			values.defaultSpeechVoice = defaultSpeechVoice;
			updateSet.defaultSpeechVoice = defaultSpeechVoice;
		}
		if (defaultSpeechSpeed !== undefined) {
			values.defaultSpeechSpeed = defaultSpeechSpeed;
			updateSet.defaultSpeechSpeed = defaultSpeechSpeed;
		}
		if (preferredName !== undefined) {
			values.preferredName = preferredName;
			updateSet.preferredName = preferredName;
		}
		if (userRole !== undefined) {
			values.userRole = userRole;
			updateSet.userRole = userRole;
		}
		if (assistantTraits !== undefined) {
			values.assistantTraits = assistantTraits;
			updateSet.assistantTraits = assistantTraits;
		}
		if (additionalContext !== undefined) {
			values.additionalContext = additionalContext;
			updateSet.additionalContext = additionalContext;
		}

		await db.insert(settingsTable).values(values).onConflictDoUpdate({
			target: settingsTable.userId,
			set: updateSet
		});

		return json({ success: true });
	} catch (err) {
		console.error('Failed to update user settings', { userId, cause: err });
		error(500, {
			message:
				"We couldn't update your settings right now. Please refresh or try again in a moment."
		});
	}
};
