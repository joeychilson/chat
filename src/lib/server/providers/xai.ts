import { env } from '$env/dynamic/private';

import { createXai } from '@ai-sdk/xai';

const xai = createXai({ apiKey: env.XAI_API_KEY });

export default xai;
