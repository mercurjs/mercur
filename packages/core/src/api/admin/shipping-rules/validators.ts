import { z } from "zod"
import {
  createFindParams,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

const ShippingRulePrice = z
  .object({
    currency_code: z.string().min(1).toLowerCase().optional(),
    region_id: z.string().min(1).optional(),
    amount: z.number().min(0),
  })
  .strict()
  .refine((price) => !!price.currency_code !== !!price.region_id, {
    message: "A price needs exactly one of currency_code or region_id",
  })

const RuleSettings = {
  requirement: z.enum(["mandatory", "optional", "not_supported"]),
  price_type: z.enum(["flat", "calculated"]),
  seller_can_edit_price: z.boolean(),
  transit_min_days: z.number().int().min(0).nullable(),
  transit_max_days: z.number().int().min(0).nullable(),
  seller_can_edit_transit: z.boolean(),
  prices: z.array(ShippingRulePrice),
}

export type AdminGetShippingRuleParamsType = z.infer<
  typeof AdminGetShippingRuleParams
>
export const AdminGetShippingRuleParams = createSelectParams()

export type AdminGetShippingRulesParamsType = z.infer<
  typeof AdminGetShippingRulesParams
>
export const AdminGetShippingRulesParams = createFindParams({
  offset: 0,
  limit: 200,
}).merge(
  z.object({
    id: z.union([z.string(), z.array(z.string())]).optional(),
    shipping_zone_id: z.union([z.string(), z.array(z.string())]).optional(),
    shipping_method_id: z.union([z.string(), z.array(z.string())]).optional(),
    shipping_profile_id: z.union([z.string(), z.array(z.string())]).optional(),
    requirement: z
      .union([
        z.enum(["mandatory", "optional", "not_supported"]),
        z.array(z.enum(["mandatory", "optional", "not_supported"])),
      ])
      .optional(),
  })
)

const CreateShippingRule = z
  .object({
    shipping_zone_id: z.string().min(1),
    shipping_method_id: z.string().min(1),
    shipping_profile_id: z.string().min(1),
    requirement: RuleSettings.requirement,
    price_type: RuleSettings.price_type.optional(),
    seller_can_edit_price: RuleSettings.seller_can_edit_price.optional(),
    transit_min_days: RuleSettings.transit_min_days.optional(),
    transit_max_days: RuleSettings.transit_max_days.optional(),
    seller_can_edit_transit: RuleSettings.seller_can_edit_transit.optional(),
    prices: RuleSettings.prices.optional(),
  })
  .strict()

const UpdateShippingRule = z
  .object({
    requirement: RuleSettings.requirement.optional(),
    price_type: RuleSettings.price_type.optional(),
    seller_can_edit_price: RuleSettings.seller_can_edit_price.optional(),
    transit_min_days: RuleSettings.transit_min_days.optional(),
    transit_max_days: RuleSettings.transit_max_days.optional(),
    seller_can_edit_transit: RuleSettings.seller_can_edit_transit.optional(),
    prices: RuleSettings.prices.optional(),
  })
  .strict()

export type AdminCreateShippingRuleType = z.infer<typeof CreateShippingRule>
export const AdminCreateShippingRule = CreateShippingRule

export type AdminUpdateShippingRuleType = z.infer<typeof UpdateShippingRule>
export const AdminUpdateShippingRule = UpdateShippingRule

export type AdminBatchShippingRulesType = z.infer<
  typeof AdminBatchShippingRules
>
export const AdminBatchShippingRules = z
  .object({
    create: z.array(CreateShippingRule).optional(),
    update: z
      .array(UpdateShippingRule.extend({ id: z.string().min(1) }))
      .optional(),
    delete: z.array(z.string()).optional(),
  })
  .strict()
