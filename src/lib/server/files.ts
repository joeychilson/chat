import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

import * as Minio from 'minio';

const endpointUrl = new URL(privateEnv.S3_ENDPOINT || 'http://localhost:9000');

export const s3Client = new Minio.Client({
	region: privateEnv.S3_REGION || 'us-east-1',
	endPoint: endpointUrl.hostname,
	port: endpointUrl.port ? parseInt(endpointUrl.port) : undefined,
	useSSL: endpointUrl.protocol === 'https:',
	accessKey: privateEnv.S3_ACCESS_KEY || '',
	secretKey: privateEnv.S3_SECRET_KEY || '',
	pathStyle: true
});

export const bucketName = privateEnv.S3_BUCKET || 'chat';

export const getFileUrl = (path: string) => {
	return `${publicEnv.PUBLIC_BASE_URL}/api/files/${path}`;
};
