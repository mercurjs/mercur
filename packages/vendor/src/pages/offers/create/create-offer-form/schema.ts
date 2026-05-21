import { z } from "zod"

export type VariantSnapshot = {
  variant_id: string
  variant_title: string
  product_id: string
  product_title: string
  product_thumbnail?: string | null
  variant_sku?: string | null
}

export const VariantSnapshotSchema = z.object({
  variant_id: z.string().min(1),
  variant_title: z.string(),
  product_id: z.string().min(1),
  product_title: z.string(),
  product_thumbnail: z.string().nullish(),
  variant_sku: z.string().nullish(),
})

export const OfferRowSchema = z.object({
  sku: z.string().max(64).optional().default(""),
  locations: z.record(z.string(), z.boolean()).default({}),
  prices: z.record(z.string(), z.coerce.number().min(0)).default({}),
})

export type OfferRow = z.infer<typeof OfferRowSchema>

export const CreateOfferSchema = z.object({
  selected_variant_ids: z.array(z.string().min(1)).min(1),
  selected_variants: z.array(VariantSnapshotSchema).min(1),
  rows: z.record(z.string(), OfferRowSchema).default({}),
  shipping_profile_id: z.string().min(1),
})

export type CreateOfferFormValues = z.infer<typeof CreateOfferSchema>

export const isRowPublishable = (row: OfferRow): boolean => {
  const hasSku = !!row.sku && row.sku.trim().length > 0
  const hasEnabledLocation = Object.values(row.locations ?? {}).some(Boolean)
  const hasNonZeroPrice = Object.values(row.prices ?? {}).some((v) => Number(v) > 0)
  return hasSku || hasEnabledLocation || hasNonZeroPrice
}

export const requiresSku = (row: OfferRow): boolean => {
  const hasEnabledLocation = Object.values(row.locations ?? {}).some(Boolean)
  const hasNonZeroPrice = Object.values(row.prices ?? {}).some((v) => Number(v) > 0)
  return hasEnabledLocation || hasNonZeroPrice
}
