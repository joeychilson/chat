import { randomUUID } from 'crypto';

import { error, json } from '@sveltejs/kit';

import { experimental_generateSpeech } from 'ai';
import { eq } from 'drizzle-orm';

import db from '$lib/server/db';
import { messagesTable, filesTable, creationsTable } from '$lib/server/db/schema';
import { generateSpeechTitle } from '$lib/server/generation';
import { bucketName, getFileUrl, s3Client } from '$lib/server/files';
import openai from '$lib/server/providers/openai';

export async function POST({ params, locals }) {
	if (!locals.session || !locals.user) {
		error(401, { message: 'You must be signed in to generate speech.' });
	}

	const user = locals.user;
	const messageId = params.id;

	try {
		const message = await db
			.select()
			.from(messagesTable)
			.where(eq(messagesTable.id, messageId))
			.limit(1);

		if (!message[0]) {
			error(404, { message: "We couldn't find the message you were looking for." });
		}

		const chatQuery = await db.query.chatsTable.findFirst({
			where: (chats, { eq }) => eq(chats.id, message[0].chatId),
			columns: { userId: true }
		});

		if (!chatQuery || chatQuery.userId !== user.id) {
			error(403, { message: "You don't have permission to generate speech for this message." });
		}

		const messageParts = message[0].parts;
		const textPart = messageParts.find((part) => part.type === 'text');

		if (!textPart || !textPart.text) {
			error(400, { message: 'This message contains no text to convert to speech.' });
		}

		const voice = locals.session.settings?.defaultSpeechVoice || 'alloy';
		const speed = locals.session.settings?.defaultSpeechSpeed
			? parseFloat(locals.session.settings.defaultSpeechSpeed)
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
		console.error('Failed to generate speech', { userId: user.id, messageId, cause: err });
		error(500, { message: "We couldn't generate speech right now. Please try again." });
	}
}
