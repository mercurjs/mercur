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
  condition_id: z.string().default(""),
  leadtime_to_ship: z
    .union([z.coerce.number().int().min(0), z.literal("")])
    .default(""),
  prices: z.record(z.string(), optionalFloat).default({}),
  region_prices: z.record(z.string(), optionalFloat).default({}),
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
  additional_data: z.record(z.string(), z.unknown()).optional(),
})

export type OfferVariantRow = z.infer<typeof VariantRowSchema>

export const CreateOfferSchema = z.object({
  // The catalogue tab selects whole products (SPEC-009); the stock &
  // prices tab fans them out to their variants.
  selected_product_ids: z.array(z.string().min(1)).min(1),
  variants: z.array(VariantRowSchema).min(1),
})

export type CreateOfferFormValues = z.infer<typeof CreateOfferSchema>

/** Ids of the stock & prices grid's own columns, overridable through `forms`. */
export const GRID_COLUMN_IDS = [
  "title",
  "sku",
  "shipping_profile",
  "condition",
  "leadtime_to_ship",
]

/** `CreateOfferSchema` with each row's custom-field `additional_data` shape. */
export const buildCreateOfferSchema = (
  rowAdditionalData: z.ZodObject<Record<string, z.ZodTypeAny>>,
) =>
  CreateOfferSchema.extend({
    variants: z
      .array(
        VariantRowSchema.extend({
          additional_data: rowAdditionalData.partial().optional(),
        }),
      )
      .min(1),
  })

const numericOrZero = (v: number | string | undefined | null): number => {
  if (v === "" || v === null || v === undefined) return 0
  return castNumber(v) || 0
}

export const variantRowHasPrice = (
  row: OfferVariantRow,
  currencyCodes: string[],
): boolean =>
  currencyCodes.some((code) => numericOrZero(row.prices?.[code]) > 0) ||
  Object.values(row.region_prices ?? {}).some((v) => numericOrZero(v) > 0)

// SKU is prefilled from the master variant, so it can't signal intent.
export const variantRowHasPartialInput = (row: OfferVariantRow): boolean =>
  !!row.shipping_profile_id ||
  Object.values(row.inventory ?? {}).some((v) => v.checked)
