import { z } from 'zod'

import {
  ApplicationMethodAllocation,
  ApplicationMethodTargetType,
  ApplicationMethodType,
  PromotionRuleOperator,
  PromotionType
} from '@medusajs/framework/utils'
import { CreateCampaign } from '@medusajs/medusa/api/admin/campaigns/validators'
import { AdminCreatePromotionRule } from '@medusajs/medusa/api/admin/promotions/validators'
import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetPromotionsParamsType = z.infer<
  typeof VendorGetPromotionsParams
>
export const VendorGetPromotionsParams = createFindParams({
  offset: 0,
  limit: 50
})

export const VendorCreatePromotionRule = z
  .object({
    operator: z.nativeEnum(PromotionRuleOperator),
    description: z.string().nullish(),
    attribute: z.string(),
    values: z.union([z.string(), z.array(z.string())])
  })
  .strict()

export const VendorCreateApplicationMethod = z
  .object({
    description: z.string().nullish(),
    value: z.number(),
    currency_code: z.string().nullish(),
    max_quantity: z.number().nullish(),
    type: z.literal(ApplicationMethodType.PERCENTAGE),
    target_type: z.literal(ApplicationMethodTargetType.ITEMS),
    allocation: z.literal(ApplicationMethodAllocation.EACH),
    target_rules: z.array(AdminCreatePromotionRule).optional(),
    buy_rules: z.array(AdminCreatePromotionRule).optional(),
    apply_to_quantity: z.number().nullish(),
    buy_rules_min_quantity: z.number().nullish()
  })
  .strict()

export const VendorCreatePromotion = z
  .object({
    code: z.string(),
    is_automatic: z.boolean().default(false),
    type: z.literal(PromotionType.STANDARD),
    campaign_id: z.string().nullish(),
    campaign: CreateCampaign.optional(),
    application_method: VendorCreateApplicationMethod,
    rules: z.array(AdminCreatePromotionRule).optional()
  })
  .strict()
