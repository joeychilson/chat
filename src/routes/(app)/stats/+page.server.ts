import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

import { eq } from 'drizzle-orm';

import db from '$lib/server/db';
import { messagesTable, chatsTable } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session || !locals.user) {
		redirect(302, '/signin');
	}

	const userId = locals.user.id;

	const userChats = await db.query.chatsTable.findMany({
		where: eq(chatsTable.userId, userId),
		with: {
			messages: {
				where: eq(messagesTable.role, 'assistant'),
				columns: { id: true, role: true, metadata: true }
			}
		}
	});

	const allAssistantMessages = userChats.flatMap((chat) => chat.messages);

	const modelStats = new Map<
		string,
		{
			modelId: string;
			modelType: string;
			totalTokens: number;
			inputTokens: number;
			outputTokens: number;
			reasoningTokens: number;
			cachedTokens: number;
			messageCount: number;
		}
	>();

	for (const message of allAssistantMessages) {
		const metadata = message.metadata;
		if (!metadata?.model?.id) continue;

		const modelId = metadata.model.id;
		const modelType = metadata.model.type;

		if (!modelStats.has(modelId)) {
			modelStats.set(modelId, {
				modelId,
				modelType,
				totalTokens: 0,
				inputTokens: 0,
				outputTokens: 0,
				reasoningTokens: 0,
				cachedTokens: 0,
				messageCount: 0
			});
		}

		const stats = modelStats.get(modelId)!;
		stats.messageCount++;

		if (metadata.usage) {
			stats.totalTokens += metadata.usage.totalTokens || 0;
			stats.inputTokens += metadata.usage.inputTokens || 0;
			stats.outputTokens += metadata.usage.outputTokens || 0;
			stats.reasoningTokens += metadata.usage.reasoningTokens || 0;
			stats.cachedTokens += metadata.usage.cachedTokens || 0;
		}
	}

	const modelStatsArray = Array.from(modelStats.values());

	const modelTokenStats = modelStatsArray
		.filter((stat) => stat.totalTokens > 0)
		.sort((a, b) => b.totalTokens - a.totalTokens);

	const modelMessageStats = modelStatsArray.sort((a, b) => b.messageCount - a.messageCount);

	return {
		modelTokenStats,
		modelMessageStats
	};
};
