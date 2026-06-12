import { z } from "zod"

const VariantRowSchema = z.object({
  variant_id: z.string().min(1),
  product_id: z.string().min(1),
  product_title: z.string(),
  variant_title: z.string(),
  product_thumbnail: z.string().nullish(),
  variant_sku: z.string().nullish(),
  sku: z.string().max(64).default(""),
  shipping_profile_id: z.string().default(""),
  prices: z.record(z.string(), z.union([z.coerce.number().min(0), z.literal("")])).default({}),
  inventory: z
    .record(
      z.string(),
      z.object({
        checked: z.boolean().default(false),
        quantity: z.union([z.coerce.number().min(0), z.literal("")]).default(""),
        disabledToggle: z.boolean().optional(),
      }),
    )
    .default({}),
})

export type OfferVariantRow = z.infer<typeof VariantRowSchema>

export const CreateOfferSchema = z.object({
  // The catalogue tab selects whole products (SPEC-009); the stock &
  // prices tab fans them out to their variants.
  selected_product_ids: z.array(z.string().min(1)).min(1),
  variants: z.array(VariantRowSchema).min(1),
})

export type CreateOfferFormValues = z.infer<typeof CreateOfferSchema>

const numericOrZero = (v: number | "" | undefined | null): number => {
  if (v === "" || v === null || v === undefined) return 0
  return Number(v) || 0
}

export const isVariantRowPublishable = (row: OfferVariantRow): boolean => {
  const hasSku = !!row.sku && row.sku.trim().length > 0
  const hasShipping =
    !!row.shipping_profile_id && row.shipping_profile_id.length > 0
  const hasEnabledLocation = Object.values(row.inventory ?? {}).some(
    (v) => v.checked,
  )
  const hasNonZeroPrice = Object.values(row.prices ?? {}).some(
    (v) => numericOrZero(v) > 0,
  )
  return hasSku || hasShipping || hasEnabledLocation || hasNonZeroPrice
}

export const variantRowRequiresSku = (row: OfferVariantRow): boolean => {
  const hasEnabledLocation = Object.values(row.inventory ?? {}).some(
    (v) => v.checked,
  )
  const hasNonZeroPrice = Object.values(row.prices ?? {}).some(
    (v) => numericOrZero(v) > 0,
  )
  return hasEnabledLocation || hasNonZeroPrice
}
