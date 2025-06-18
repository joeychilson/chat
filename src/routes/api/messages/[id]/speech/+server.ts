import { randomUUID } from 'crypto';

import { error, json } from '@sveltejs/kit';

import { experimental_generateSpeech } from 'ai';
import { eq } from 'drizzle-orm';

import db from '$lib/server/db';
import { messagesTable, filesTable, creationsTable, settingsTable } from '$lib/server/db/schema';
import { generateSpeechTitle } from '$lib/server/generation';
import { bucketName, getFileUrl, s3Client } from '$lib/server/files';
import openai from '$lib/server/providers/openai';

export async function POST({ params, locals }) {
	if (!locals.session || !locals.user) {
		error(401, { message: 'You must be signed in to generate speech.' });
	}

	const user = locals.user;
	const messageId = params.id;

	if (!messageId) {
		error(400, { message: 'Message ID is required' });
	}

	try {
		const message = await db
			.select()
			.from(messagesTable)
			.where(eq(messagesTable.id, messageId))
			.limit(1);

		if (!message[0]) {
			error(404, { message: 'Message not found' });
		}

		const chatQuery = await db.query.chatsTable.findFirst({
			where: (chats, { eq }) => eq(chats.id, message[0].chatId),
			columns: { userId: true }
		});

		if (!chatQuery || chatQuery.userId !== user.id) {
			error(403, { message: 'Access denied' });
		}

		const messageParts = message[0].parts;
		const textPart = messageParts.find((part) => part.type === 'text');

		if (!textPart || !textPart.text) {
			error(400, { message: 'Message contains no text to convert to speech' });
		}

		const userSettings = await db.query.settingsTable.findFirst({
			where: eq(settingsTable.userId, user.id)
		});

		const voice = userSettings?.defaultSpeechVoice || 'alloy';
		const speed = userSettings?.defaultSpeechSpeed
			? parseFloat(userSettings.defaultSpeechSpeed)
			: 1.0;

		const { title, filename } = await generateSpeechTitle({ text: textPart.text });

		const result = await experimental_generateSpeech({
			model: openai.speech('gpt-4o-mini-tts'),
			text: textPart.text,
			voice,
			speed
		});

		const audioBuffer = Buffer.from(result.audio.base64, 'base64');
		const extension = 'mp3';
		const mediaType = 'audio/mpeg';
		const fileId = randomUUID();
		const filePath = `${user.id}/${fileId}.${extension}`;

		await s3Client.putObject(bucketName, filePath, audioBuffer, undefined, {
			'Content-Type': mediaType
		});

		const [savedFile] = await db
			.insert(filesTable)
			.values({
				userId: user.id,
				name: `${filename}.${extension}`,
				mediaType,
				size: audioBuffer.length,
				path: filePath
			})
			.returning({ id: filesTable.id });

		await db.insert(creationsTable).values({
			userId: user.id,
			fileId: savedFile.id,
			type: 'audio',
			title,
			metadata: {
				model: {
					id: 'gpt-4o-mini-tts',
					type: 'speech',
					options: {
						voice,
						speed
					}
				}
			}
		});

		const fileUrl = getFileUrl(filePath);

		const updatedParts = [
			...messageParts,
			{
				type: 'file' as const,
				url: fileUrl,
				mediaType: 'audio/mpeg',
				filename: `${filename}.${extension}`
			}
		];

		await db
			.update(messagesTable)
			.set({
				parts: updatedParts,
				updatedAt: new Date()
			})
			.where(eq(messagesTable.id, messageId));

		return json({
			success: true,
			audio: {
				url: fileUrl,
				filename: `${filename}.${extension}`,
				mediaType: 'audio/mpeg'
			},
			message: {
				id: messageId,
				parts: updatedParts
			}
		});
	} catch (err) {
		console.error('Speech generation failed:', err);
		error(500, { message: 'Failed to generate speech' });
	}
}
