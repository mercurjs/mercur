import { z } from "zod"

const ProductBulkEditItemSchema = z.object({
  title: z.string(),
  status: z.enum(["draft", "published"]),
  discountable: z.boolean(),
})

export const ProductBulkEditSchema = z.object({
  products: z.record(ProductBulkEditItemSchema),
})

export type ProductBulkEditItemSchema = z.infer<
  typeof ProductBulkEditItemSchema
>
export type ProductBulkEditSchema = z.infer<
  typeof ProductBulkEditSchema
>
