import { z } from 'zod';

export const StorePostOrderEditsReqSchema = z.object({
  order_id: z.string(),
  description: z.string().optional(),
  internal_note: z.string().optional(),
  metadata: z.record(z.unknown()).nullish()
});

export type StorePostOrderEditsReqSchemaType = z.infer<
  typeof StorePostOrderEditsReqSchema
>;
