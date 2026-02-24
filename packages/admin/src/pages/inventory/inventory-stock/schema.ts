import { z } from "zod"

const LocationQuantitySchema = z.object({
  id: z.string().optional(),
  quantity: z.union([z.number(), z.string()]),
  checked: z.boolean(),
  disabledToggle: z.boolean(),
})

const InventoryLocationsSchema = z.record(LocationQuantitySchema)

const InventoryItemSchema = z.object({
  locations: InventoryLocationsSchema,
})

export const InventoryStockSchema = z.object({
  inventory_items: z.record(InventoryItemSchema),
})

export type InventoryLocationsSchema = z.infer<typeof InventoryLocationsSchema>
export type InventoryItemSchema = z.infer<typeof InventoryItemSchema>
export type InventoryStockSchema = z.infer<typeof InventoryStockSchema>
