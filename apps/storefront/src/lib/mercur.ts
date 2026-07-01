import { createClient, type InferClient } from '@mercurjs/client';
import type { Routes } from '@mercurjs/core/_generated';

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';

export const mercur: InferClient<Routes> = createClient({
  baseUrl: MEDUSA_BACKEND_URL,
  fetchOptions: {
    headers: {
      'x-publishable-api-key': process.env
        .NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
    },
  },
});
