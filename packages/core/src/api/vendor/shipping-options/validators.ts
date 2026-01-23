import {
  PricingRuleOperator,
  RuleOperator,
  ShippingOptionPriceType as ShippingOptionPriceTypeEnum,
} from "@medusajs/framework/utils"
import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"
import { isDefined } from "@medusajs/framework/utils"

export type VendorGetShippingOptionParamsType = z.infer<
  typeof VendorGetShippingOptionParams
>
export const VendorGetShippingOptionParams = createSelectParams()

export type VendorGetShippingOptionsParamsType = z.infer<
  typeof VendorGetShippingOptionsParams
>
export const VendorGetShippingOptionsParams = createFindParams({
  offset: 0,
  limit: 20,
}).merge(
  z.object({
    id: z.union([z.string(), z.array(z.string())]).optional(),
    q: z.string().optional(),
    service_zone_id: z.union([z.string(), z.array(z.string())]).optional(),
    shipping_profile_id: z.union([z.string(), z.array(z.string())]).optional(),
    provider_id: z.union([z.string(), z.array(z.string())]).optional(),
    shipping_option_type_id: z
      .union([z.string(), z.array(z.string())])
      .optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

export type VendorGetShippingOptionRuleParamsType = z.infer<
  typeof VendorGetShippingOptionRuleParams
>
export const VendorGetShippingOptionRuleParams = createSelectParams()

export type VendorCreateShippingOptionRuleType = z.infer<
  typeof VendorCreateShippingOptionRule
>
export const VendorCreateShippingOptionRule = z
  .object({
    operator: z.nativeEnum(RuleOperator),
    attribute: z.string(),
    value: z.string().or(z.array(z.string())),
  })
  .strict()

export type VendorUpdateShippingOptionRuleType = z.infer<
  typeof VendorUpdateShippingOptionRule
>
export const VendorUpdateShippingOptionRule = z
  .object({
    id: z.string(),
    operator: z.nativeEnum(RuleOperator),
    attribute: z.string(),
    value: z.string().or(z.array(z.string())),
  })
  .strict()

export const VendorCreateShippingOptionTypeObject = z
  .object({
    label: z.string(),
    description: z.string().optional(),
    code: z.string(),
  })
  .strict()

const VendorPriceRules = z.array(
  z.object({
    attribute: z.literal("item_total"),
    operator: z.nativeEnum(PricingRuleOperator),
    value: z.number(),
  })
)

export const VendorCreateShippingOptionPriceWithCurrency = z
  .object({
    currency_code: z.string(),
    amount: z.number(),
    rules: VendorPriceRules.optional(),
  })
  .strict()

export const VendorCreateShippingOptionPriceWithRegion = z
  .object({
    region_id: z.string(),
    amount: z.number(),
    rules: VendorPriceRules.optional(),
  })
  .strict()

export const VendorUpdateShippingOptionPriceWithCurrency = z
  .object({
    id: z.string().optional(),
    currency_code: z.string().optional(),
    amount: z.number().optional(),
    rules: VendorPriceRules.optional(),
  })
  .strict()

export const VendorUpdateShippingOptionPriceWithRegion = z
  .object({
    id: z.string().optional(),
    region_id: z.string().optional(),
    amount: z.number().optional(),
    rules: VendorPriceRules.optional(),
  })
  .strict()

export type VendorCreateShippingOptionType = z.infer<
  typeof VendorCreateShippingOption
>
export const VendorCreateShippingOption = z
  .object({
    name: z.string(),
    service_zone_id: z.string(),
    shipping_profile_id: z.string(),
    data: z.record(z.unknown()).optional(),
    price_type: z.nativeEnum(ShippingOptionPriceTypeEnum),
    provider_id: z.string(),
    type: VendorCreateShippingOptionTypeObject.optional(),
    type_id: z.string().optional(),
    prices: VendorCreateShippingOptionPriceWithCurrency.or(
      VendorCreateShippingOptionPriceWithRegion
    ).array(),
    rules: VendorCreateShippingOptionRule.array().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict()
  .refine((data) => isDefined(data.type_id) !== isDefined(data.type), {
    message:
      "Exactly one of 'type' or 'type_id' must be provided, but not both",
    path: ["type_id", "type"],
  })

export type VendorUpdateShippingOptionType = z.infer<
  typeof VendorUpdateShippingOption
>
export const VendorUpdateShippingOption = z
  .object({
    name: z.string().optional(),
    data: z.record(z.unknown()).optional(),
    price_type: z.nativeEnum(ShippingOptionPriceTypeEnum).optional(),
    provider_id: z.string().optional(),
    shipping_profile_id: z.string().optional(),
    type: VendorCreateShippingOptionTypeObject.optional(),
    type_id: z.string().optional(),
    prices: VendorUpdateShippingOptionPriceWithCurrency.or(
      VendorUpdateShippingOptionPriceWithRegion
    )
      .array()
      .optional(),
    rules: VendorUpdateShippingOptionRule.or(VendorCreateShippingOptionRule)
      .array()
      .optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict()
  .refine(
    (data) => {
      const hasType = isDefined(data.type)
      const hasTypeId = isDefined(data.type_id)

      if (!hasType && !hasTypeId) {
        return true
      }

      return hasType !== hasTypeId
    },
    {
      message: "Only one of 'type' or 'type_id' can be provided",
      path: ["type_id", "type"],
    }
  )
