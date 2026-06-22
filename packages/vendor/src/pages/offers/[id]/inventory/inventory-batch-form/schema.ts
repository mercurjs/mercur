import { z } from "zod"

const LocationQuantitySchema = z.object({
  id: z.string().optional(),
  quantity: z.union([z.number(), z.string()]),
  checked: z.boolean(),
  disabledToggle: z.boolean(),
})

const InventoryItemLocationsSchema = z.record(
  z.string(),
  LocationQuantitySchema,
)

const InventoryItemSchema = z.object({
  locations: InventoryItemLocationsSchema,
})

export const OfferStockSchema = z.object({
  inventory_items: z.record(z.string(), InventoryItemSchema),
})

export type OfferStockLocationSchema = z.infer<
  typeof InventoryItemLocationsSchema
>
export type OfferStockInventoryItemSchema = z.infer<typeof InventoryItemSchema>
export type OfferStockFormValues = z.infer<typeof OfferStockSchema>
