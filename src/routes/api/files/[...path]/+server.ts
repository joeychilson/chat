import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { Readable } from 'node:stream';

import { bucketName, s3Client } from '$lib/server/files';

export const GET: RequestHandler = async ({ params }) => {
	const path = params.path;

	try {
		const objectStream = await s3Client.getObject(bucketName, path);
		if (!objectStream) {
			error(404, { message: 'File not found' });
		}

		const stat = await s3Client.statObject(bucketName, path);
		const webStream = Readable.toWeb(objectStream) as ReadableStream;

		return new Response(webStream, {
			status: 200,
			headers: {
				'Content-Type': stat.metaData?.['content-type'] || 'application/octet-stream',
				'Content-Length': stat.size?.toString() || '0',
				'Content-Disposition': `inline; filename="${path}"`,
				'Cache-Control': 'public, max-age=31536000, immutable',
				ETag: stat.etag || ''
			}
		});
	} catch (err) {
		console.error('Failed to get file', { path, cause: err });
		error(500, { message: "We couldn't get your file right now. Please try again." });
	}
};
