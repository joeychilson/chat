import { createResumableStreamContext } from 'resumable-stream/redis';

import { getPublisher, getSubscriber } from './redis';

export const getStreamContext = async () => {
	const publisher = await getPublisher();
	const subscriber = await getSubscriber();

	return createResumableStreamContext({
		waitUntil: async (promise) => {
			await promise;
		},
		publisher,
		subscriber
	});
};
