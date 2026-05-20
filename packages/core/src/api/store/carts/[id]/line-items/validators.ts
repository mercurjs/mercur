import { z } from "zod"

export const StoreAddCartLineItem = z
  .object({
    offer_id: z.string().min(1, "offer_id is required"),
    quantity: z.number().int().positive(),
    variant_id: z.string().optional(),
    unit_price: z.number().optional(),
    compare_at_unit_price: z.number().optional(),
    metadata: z.record(z.unknown()).optional(),
    additional_data: z.record(z.unknown()).optional(),
  })
  .strict()

export type StoreAddCartLineItemType = z.infer<typeof StoreAddCartLineItem>
