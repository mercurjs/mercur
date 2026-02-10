import { z } from "zod"

export const ProductStockLocationSchema = z.object({
  id: z.string().optional(),
  quantity: z.union([z.number(), z.string()]),
  checked: z.boolean(),
  disabledToggle: z.boolean().optional(),
})

export const ProductStockInventoryItemSchema = z.object({
  locations: z.record(ProductStockLocationSchema),
})

export const ProductStockVariantSchema = z.object({
  inventory_items: z.record(ProductStockInventoryItemSchema),
})

export const ProductStockSchema = z.object({
  variants: z.record(ProductStockVariantSchema),
})

export type ProductStockLocationSchema = z.infer<typeof ProductStockLocationSchema>
export type ProductStockInventoryItemSchema = z.infer<typeof ProductStockInventoryItemSchema>
export type ProductStockVariantSchema = z.infer<typeof ProductStockVariantSchema>
export type ProductStockSchema = z.infer<typeof ProductStockSchema>
