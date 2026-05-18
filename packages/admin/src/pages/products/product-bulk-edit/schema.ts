import { z } from "zod"

export const ProductBulkEditItemSchema = z.object({
  id: z.string(),
  status: z.enum([
    "draft",
    "proposed",
    "published",
    "requires_action",
    "rejected",
  ]),
  discountable: z.boolean(),
})

export const ProductBulkEditSchema = z.object({
  products: z.array(ProductBulkEditItemSchema),
})

export type ProductBulkEditItemSchema = z.infer<typeof ProductBulkEditItemSchema>
export type ProductBulkEditSchema = z.infer<typeof ProductBulkEditSchema>
