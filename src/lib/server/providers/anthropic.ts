import { env } from '$env/dynamic/private';

import { createAnthropic } from '@ai-sdk/anthropic';

const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });

export default anthropic;
