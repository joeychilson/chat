import { z } from 'zod';

export const creationMetadataSchema = z.object({
	model: z
		.object({
			id: z.string(),
			type: z.string(),
			options: z.record(z.string(), z.any()).optional()
		})
		.optional(),
	duration: z.number().optional()
});

export type CreationMetadata = z.infer<typeof creationMetadataSchema>;
