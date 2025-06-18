import { env } from '$env/dynamic/private';

import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({ apiKey: env.GOOGLE_API_KEY });

export default google;
