import {
  ApplicationMethodTargetType,
  ApplicationMethodType,
  PromotionRuleOperator,
  PromotionStatus,
  PromotionType,
} from "@medusajs/framework/utils"
import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"
import { VendorCreateCampaign } from "../campaigns/validators"

export type VendorGetPromotionParamsType = z.infer<
  typeof VendorGetPromotionParams
>
export const VendorGetPromotionParams = createSelectParams()

export const VendorGetPromotionsParamsFields = z.object({
  q: z.string().optional(),
  code: z
    .union([z.string(), z.array(z.string()), createOperatorMap()])
    .optional(),
  id: z
    .union([z.string(), z.array(z.string()), createOperatorMap()])
    .optional(),
  campaign_id: z.union([z.string(), z.array(z.string())]).optional(),
  is_automatic: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((value) => (typeof value === "string" ? value === "true" : value))
    .optional(),
  application_method: z
    .object({
      currency_code: z.union([z.string(), z.array(z.string())]).optional(),
      type: z.union([z.string(), z.array(z.string())]).optional(),
    })
    .optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
  deleted_at: createOperatorMap().optional(),
})

export type VendorGetPromotionsParamsType = z.infer<
  typeof VendorGetPromotionsParams
>
export const VendorGetPromotionsParams = createFindParams({
  limit: 50,
  offset: 0,
}).merge(VendorGetPromotionsParamsFields)

export type VendorGetPromotionRuleParamsType = z.infer<
  typeof VendorGetPromotionRuleParams
>
export const VendorGetPromotionRuleParams = z.object({
  promotion_type: z.string().optional(),
  application_method_type: z.string().optional(),
  application_method_target_type: z.string().optional(),
})

export type VendorGetPromotionRuleTypeParamsType = z.infer<
  typeof VendorGetPromotionRuleTypeParams
>
export const VendorGetPromotionRuleTypeParams = createSelectParams().merge(
  z.object({
    promotion_type: z.string().optional(),
    application_method_type: z.string().optional(),
    application_method_target_type: z.string().optional(),
  })
)

export type VendorGetPromotionsRuleValueParamsType = z.infer<
  typeof VendorGetPromotionsRuleValueParams
>
export const VendorGetPromotionsRuleValueParams = createFindParams({
  limit: 100,
  offset: 0,
}).merge(
  z.object({
    q: z.string().optional(),
    value: z.union([z.string(), z.array(z.string())]).optional(),
    application_method_target_type: z.string().optional(),
  })
)

export type VendorCreatePromotionRuleType = z.infer<
  typeof VendorCreatePromotionRule
>
export const VendorCreatePromotionRule = z
  .object({
    operator: z.nativeEnum(PromotionRuleOperator),
    description: z.string().nullish(),
    attribute: z.string(),
    values: z.union([z.string(), z.array(z.string())]),
  })
  .strict()

export type VendorUpdatePromotionRuleType = z.infer<
  typeof VendorUpdatePromotionRule
>
export const VendorUpdatePromotionRule = z
  .object({
    id: z.string(),
    operator: z.nativeEnum(PromotionRuleOperator).optional(),
    description: z.string().nullish(),
    attribute: z.string().optional(),
    values: z.union([z.string(), z.array(z.string())]),
  })
  .strict()

export type VendorCreateApplicationMethodType = z.infer<
  typeof VendorCreateApplicationMethod
>
export const VendorCreateApplicationMethod = z
  .object({
    description: z.string().nullish(),
    value: z.number(),
    currency_code: z.string().optional(),
    max_quantity: z.number().nullish(),
    type: z.nativeEnum(ApplicationMethodType),
    target_type: z.nativeEnum(ApplicationMethodTargetType),
    allocation: z.enum(["each", "across", "once"]).optional(),
    target_rules: z.array(VendorCreatePromotionRule).optional(),
    buy_rules: z.array(VendorCreatePromotionRule).optional(),
    apply_to_quantity: z.number().nullish(),
    buy_rules_min_quantity: z.number().nullish(),
  })
  .strict()

export type VendorUpdateApplicationMethodType = z.infer<
  typeof VendorUpdateApplicationMethod
>
export const VendorUpdateApplicationMethod = z
  .object({
    description: z.string().nullish(),
    value: z.number().optional(),
    max_quantity: z.number().nullish(),
    currency_code: z.string().optional(),
    type: z.nativeEnum(ApplicationMethodType).optional(),
    target_type: z.nativeEnum(ApplicationMethodTargetType).optional(),
    allocation: z.enum(["each", "across", "once"]).optional(),
    apply_to_quantity: z.number().nullish(),
    buy_rules_min_quantity: z.number().nullish(),
  })
  .strict()

const buygetRefinement = (promo: any) => {
  if (promo.campaign && promo.campaign_id) {
    return false
  }

  if (promo.type === PromotionType.BUYGET) {
    const appMethod = promo.application_method
    return (
      (appMethod?.buy_rules?.length ?? 0) > 0 &&
      appMethod?.apply_to_quantity !== undefined &&
      appMethod?.buy_rules_min_quantity !== undefined
    )
  }

  return true
}

const automaticLimitRefinement = (promo: any) => {
  return !(promo.is_automatic && promo.limit !== undefined && promo.limit !== null)
}

export type VendorCreatePromotionType = z.infer<typeof VendorCreatePromotion>
export const VendorCreatePromotion = z
  .object({
    code: z.string(),
    is_automatic: z.boolean().optional(),
    type: z.nativeEnum(PromotionType),
    is_tax_inclusive: z.boolean().optional(),
    status: z.nativeEnum(PromotionStatus).default(PromotionStatus.DRAFT),
    campaign_id: z.string().optional(),
    campaign: VendorCreateCampaign.optional(),
    limit: z.number().int().min(1).nullish(),
    application_method: VendorCreateApplicationMethod,
    rules: z.array(VendorCreatePromotionRule).optional(),
    additional_data: z.record(z.unknown()).nullish(),
  })
  .strict()
  .refine(buygetRefinement, {
    message:
      "Buyget promotions require at least one buy rule and quantities to be defined",
  })
  .refine(automaticLimitRefinement, {
    message: "Automatic promotions cannot have a usage limit",
    path: ["limit"],
  })

export type VendorUpdatePromotionType = z.infer<typeof VendorUpdatePromotion>
export const VendorUpdatePromotion = z
  .object({
    code: z.string().optional(),
    is_automatic: z.boolean().optional(),
    is_tax_inclusive: z.boolean().optional(),
    type: z.nativeEnum(PromotionType).optional(),
    status: z.nativeEnum(PromotionStatus).optional(),
    campaign_id: z.string().nullish(),
    limit: z.number().int().min(1).nullish(),
    application_method: VendorUpdateApplicationMethod.optional(),
    additional_data: z.record(z.unknown()).nullish(),
  })
  .strict()
  .refine(automaticLimitRefinement, {
    message: "Automatic promotions cannot have a usage limit",
    path: ["limit"],
  })
