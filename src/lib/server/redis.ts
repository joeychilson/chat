import { env } from '$env/dynamic/private';
import { createClient } from 'redis';

let publisherClient: ReturnType<typeof createClient> | null = null;
let subscriberClient: ReturnType<typeof createClient> | null = null;

export const getPublisher = async () => {
	if (!publisherClient) {
		publisherClient = createClient({ url: env.REDIS_URL! });
		await publisherClient.connect();
	}
	return publisherClient;
};

export const getSubscriber = async () => {
	if (!subscriberClient) {
		subscriberClient = createClient({ url: env.REDIS_URL! });
		await subscriberClient.connect();
	}
	return subscriberClient;
};
