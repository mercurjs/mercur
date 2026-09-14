import { z } from "zod"

import { castNumber } from "../../../../lib/cast-number"
import { optionalFloat } from "../../../../lib/validation"

const VariantRowSchema = z.object({
  variant_id: z.string().min(1),
  product_id: z.string().min(1),
  product_title: z.string(),
  variant_title: z.string(),
  product_thumbnail: z.string().nullish(),
  variant_sku: z.string().nullish(),
  sku: z.string().max(64).default(""),
  shipping_profile_id: z.string().default(""),
  prices: z.record(z.string(), optionalFloat).default({}),
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

const numericOrZero = (v: number | string | undefined | null): number => {
  if (v === "" || v === null || v === undefined) return 0
  return castNumber(v) || 0
}

export const variantRowHasPrice = (
  row: OfferVariantRow,
  currencyCode: string,
): boolean => numericOrZero(row.prices?.[currencyCode]) > 0

// SKU is prefilled from the master variant, so it can't signal intent.
export const variantRowHasPartialInput = (row: OfferVariantRow): boolean =>
  !!row.shipping_profile_id ||
  Object.values(row.inventory ?? {}).some((v) => v.checked)
