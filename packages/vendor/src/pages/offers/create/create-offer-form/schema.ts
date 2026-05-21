import { z } from "zod"

const PriceRowSchema = z
  .object({
    amount: z.coerce.number().nonnegative(),
    currency_code: z.string().min(1),
    region_id: z.string().nullish(),
    customer_group_id: z.string().nullish(),
    min_quantity: z
      .union([z.coerce.number().int().positive(), z.literal("")])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    max_quantity: z
      .union([z.coerce.number().int().positive(), z.literal("")])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
  })
  .strict()

const InventoryRowSchema = z
  .object({
    inventory_item_id: z.string().min(1),
    required_quantity: z.coerce.number().int().positive().default(1),
  })
  .strict()

export const CreateOfferSchema = z.object({
  variant_id: z.string().min(1),
  sku: z.string().min(1).max(64),
  shipping_profile_id: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).nullish(),
  prices: z.array(PriceRowSchema).min(1),
  inventory_items: z.array(InventoryRowSchema).min(1),
})

export type CreateOfferFormValues = z.infer<typeof CreateOfferSchema>

const dedupeKey = (row: CreateOfferFormValues["prices"][number]) =>
  [
    row.currency_code,
    row.region_id ?? "",
    row.customer_group_id ?? "",
    row.min_quantity ?? "",
    row.max_quantity ?? "",
  ].join("|")

export const findDuplicatePriceIndexes = (
  prices: CreateOfferFormValues["prices"],
): number[] => {
  const seen = new Map<string, number>()
  const duplicates: number[] = []
  prices.forEach((row, idx) => {
    const key = dedupeKey(row)
    if (seen.has(key)) {
      duplicates.push(idx)
    } else {
      seen.set(key, idx)
    }
  })
  return duplicates
}

export const findDuplicateInventoryIndexes = (
  items: CreateOfferFormValues["inventory_items"],
): number[] => {
  const seen = new Map<string, number>()
  const duplicates: number[] = []
  items.forEach((row, idx) => {
    if (!row.inventory_item_id) return
    if (seen.has(row.inventory_item_id)) {
      duplicates.push(idx)
    } else {
      seen.set(row.inventory_item_id, idx)
    }
  })
  return duplicates
}
