import { type UIMessage, generateObject } from 'ai';
import { z } from 'zod';

import google from '$lib/server/providers/google';
import type { Settings } from '$lib/server/db/schema';

export async function generateChatTitle({
	message
}: {
	message: UIMessage;
}): Promise<{ title: string }> {
	try {
		const result = await generateObject({
			model: google('gemini-2.0-flash-lite'),
			schema: z.object({
				title: z.string()
			}),
			system: `
			Create a concise, engaging title for this chat conversation based on the user's message.

			Guidelines:
			- 2-6 words maximum
			- Use title case (capitalize main words)
			- Focus on the core topic, task, or question
			- Avoid generic words like "help", "question", "request"
			- No quotation marks, colons, or special characters
			- Make it specific and actionable when possible

			Examples:
			- "Build React Component" (not "Help with React")
			- "Debug API Error" (not "Fix Code Issue")
			- "Design Database Schema" (not "Database Question")
			- "Optimize Image Loading" (not "Performance Help")
			`,
			messages: [
				{
					role: 'user',
					content:
						message.parts
							?.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
							.map((part) => part.text)
							.join(' ') ?? ''
				}
			]
		});

		return result.object;
	} catch (error) {
		throw new Error('Failed to generate chat title', { cause: error });
	}
}

export async function generateImageTitle({
	imageBase64
}: {
	imageBase64: string;
}): Promise<{ title: string; filename: string }> {
	try {
		const result = await generateObject({
			model: google('gemini-2.0-flash-lite'),
			schema: z.object({
				title: z.string(),
				filename: z.string()
			}),
			system: `
			Analyze this image and provide both a descriptive title and filename.

			For the **Title** (2-6 words):
			- Describe the main subject, scene, or content
			- Use engaging, specific language
			- Consider mood, style, and context
			- Use title case capitalization

			For the **Filename** (lowercase with hyphens):
			- Use descriptive keywords that capture the essence
			- Include relevant details like colors, objects, settings
			- Use only letters, numbers, hyphens, and underscores
			- Make it search-friendly and organized

			Image Type Examples:
			- Screenshots: "Dashboard Interface" → "dashboard-settings-interface"
			- Photos: "Golden Hour Landscape" → "golden-hour-mountain-sunset"
			- Diagrams: "Database Schema" → "user-database-schema-diagram"
			- Artwork: "Abstract Digital Art" → "blue-abstract-digital-composition"
			- UI/Design: "Mobile App Mockup" → "mobile-shopping-app-mockup"
			`,
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'image',
							image: imageBase64
						}
					]
				}
			]
		});

		return result.object;
	} catch (error) {
		throw new Error('Failed to generate image title', { cause: error });
	}
}

export async function generateSpeechTitle({
	text
}: {
	text: string;
}): Promise<{ title: string; filename: string }> {
	try {
		const result = await generateObject({
			model: google('gemini-2.0-flash-lite'),
			schema: z.object({
				title: z.string(),
				filename: z.string()
			}),
			system: `
			Analyze this text that will be converted to speech and provide a title and filename.

			For the **Title** (2-6 words):
			- Identify the content type and purpose
			- Capture the main topic or theme
			- Consider the intended audience or use case
			- Use clear, descriptive language
			- Include dates if mentioned (format: "Jan 15" or "2024")

			For the **Filename** (lowercase with hyphens):
			- Include content type and key topics
			- Make it organized and searchable
			- Use only letters, numbers, hyphens, and underscores
			- Consider adding context like "narration", "announcement", "guide"
			- Include dates if mentioned (format: "2024-01-15" or "jan-15-2024")

			Content Type Examples:
			- Narratives: "Product Demo Script" → "product-demo-narration"
			- Instructions: "Setup Guide Audio" → "installation-setup-guide"
			- Announcements: "Launch Announcement" → "product-launch-announcement"
			- Explanations: "API Documentation" → "api-usage-explanation"
			- Stories: "User Success Story" → "customer-success-testimonial"
			- Presentations: "Quarterly Review" → "q4-results-presentation"

			Date-Specific Examples:
			- News: "News Summary Jan 15" → "news-summary-2024-01-15"
			- Reports: "Weekly Report Dec 1" → "weekly-report-2024-12-01"
			- Updates: "Market Update Today" → "market-update-2024-01-15"
			- Events: "Conference Day 1" → "conference-day-1-2024-01-15"
			- Meetings: "Team Meeting Notes" → "team-meeting-2024-01-15"
			`,
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: text
						}
					]
				}
			]
		});

		return result.object;
	} catch (error) {
		throw new Error('Failed to generate speech title', { cause: error });
	}
}

export function generateSystemPrompt(userSettings?: Settings | null): string {
	const currentDate = new Date().toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	let systemPrompt = `You are a helpful, knowledgeable AI assistant. Today is ${currentDate}.`;

	if (!userSettings) {
		return systemPrompt;
	}

	const personalizations: string[] = [];

	if (userSettings.preferredName) {
		personalizations.push(`The user prefers to be called ${userSettings.preferredName}.`);
	}

	if (userSettings.userRole) {
		personalizations.push(`The user is a ${userSettings.userRole}.`);
	}

	if (userSettings.assistantTraits && userSettings.assistantTraits.length > 0) {
		const traits = userSettings.assistantTraits.join(', ');
		personalizations.push(`Please be ${traits} in your responses.`);
	}

	if (userSettings.additionalContext) {
		personalizations.push(`Additional context about the user: ${userSettings.additionalContext}`);
	}

	if (personalizations.length > 0) {
		systemPrompt += '\n\n' + personalizations.join(' ');
	}

	return systemPrompt;
}
