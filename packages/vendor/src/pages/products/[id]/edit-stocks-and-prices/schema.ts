import * as zod from "zod"

const LocationSchema = zod.object({
  id: zod.string(),
  quantity: zod.union([zod.number(), zod.string(), zod.null()]).optional(),
  checked: zod.boolean(),
  disabledToggle: zod.boolean(),
  level_id: zod.string().optional(),
})

export const UpdateVariantStocksSchema = zod.object({
  variants: zod.array(
    zod.object({
      id: zod.string(),
      title: zod.string().optional(),
      inventory_item_id: zod.string().optional(),
      prices: zod
        .record(zod.string(), zod.string().or(zod.number()).optional())
        .optional(),
      locations: zod.array(LocationSchema),
    })
  ),
})

export type UpdateVariantStocksSchemaType = zod.infer<
  typeof UpdateVariantStocksSchema
>
