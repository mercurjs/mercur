import { z } from "zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { booleanString } from "@medusajs/medusa/api/utils/common-validators/common"

export type VendorGetShippingRulesParamsType = z.infer<
  typeof VendorGetShippingRulesParams
>
export const VendorGetShippingRulesParams = createFindParams({
  offset: 0,
  limit: 200,
}).merge(
  z.object({
    shipping_zone_id: z.union([z.string(), z.array(z.string())]).optional(),
    shipping_profile_id: z.union([z.string(), z.array(z.string())]).optional(),
    stock_location_id: z.string().optional(),
    missing_mandatory: booleanString().optional(),
  })
)

const SellerShippingPrice = z
  .object({
    currency_code: z.string().min(1).toLowerCase().optional(),
    region_id: z.string().min(1).optional(),
    amount: z.number().min(0),
  })
  .strict()
  .refine((price) => !!price.currency_code !== !!price.region_id, {
    message: "A price needs exactly one of currency_code or region_id",
  })

export type VendorEnableShippingRuleType = z.infer<
  typeof VendorEnableShippingRule
>
export const VendorEnableShippingRule = z
  .object({
    stock_location_id: z.string().min(1),
    prices: z.array(SellerShippingPrice).optional(),
    transit_min_days: z.number().int().min(0).nullish(),
    transit_max_days: z.number().int().min(0).nullish(),
  })
  .strict()
