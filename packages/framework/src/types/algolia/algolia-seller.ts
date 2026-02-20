import { z } from 'zod';

export type AlgoliaSeller = z.infer<typeof AlgoliaSellerValidator>;
export const AlgoliaSellerValidator = z.object({
  id: z.string(),
  name: z.string(),
  handle: z.string(),
  description: z.string().nullable(),
  photo: z.union([z.string().url(), z.literal(''), z.null()])
});
