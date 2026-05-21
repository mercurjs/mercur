import { z } from "zod"

const ExistingRowSchema = z.object({
  kind: z.literal("existing"),
  link_id: z.string().optional(),
  inventory_item_id: z.string().min(1),
  required_quantity: z.coerce.number().int().positive(),
  original_required_quantity: z.number().int().positive(),
  marked_for_delete: z.boolean(),
  inventory_item_title: z.string().nullish(),
  inventory_item_sku: z.string().nullish(),
})

const NewRowSchema = z.object({
  kind: z.literal("new"),
  inventory_item_id: z.string().min(1),
  required_quantity: z.coerce.number().int().positive(),
})

export const BatchInventoryFormSchema = z.object({
  rows: z.array(z.union([ExistingRowSchema, NewRowSchema])),
})

export type BatchInventoryFormValues = z.infer<typeof BatchInventoryFormSchema>
export type ExistingBatchRow = z.infer<typeof ExistingRowSchema>
export type NewBatchRow = z.infer<typeof NewRowSchema>
