import { z } from 'zod';

export const StoreCancelOrderItemsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        quantity: z.number().int().positive()
      })
    )
    .min(1, 'At least one item must be specified for cancellation')
});

export type StoreCancelOrderItemsType = z.infer<
  typeof StoreCancelOrderItemsSchema
>;
