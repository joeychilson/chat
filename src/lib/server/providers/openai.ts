import { env } from '$env/dynamic/private';

import { createOpenAI } from '@ai-sdk/openai';

const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });

export default openai;
