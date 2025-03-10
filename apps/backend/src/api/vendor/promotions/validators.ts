import { z } from 'zod'

import {
  ApplicationMethodAllocation,
  ApplicationMethodTargetType,
  ApplicationMethodType,
  PromotionType
} from '@medusajs/framework/utils'
import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetPromotionsParamsType = z.infer<
  typeof VendorGetPromotionsParams
>
export const VendorGetPromotionsParams = createFindParams({
  offset: 0,
  limit: 50
})

/**
 * @schema VendorCreatePromotionRule
 * type: object
 * properties:
 *   description:
 *     type: string
 *     description: The description of the rule.
 *   attribute:
 *     type: string
 *     description: The attribute of the rule.
 *   operator:
 *     type: string
 *     enum: [in,eq]
 *     description: The operator of the rule.
 *   values:
 *     type: array
 *     description: Rule values.
 *     items:
 *        type: string
 */
export const VendorCreatePromotionRule = z
  .object({
    operator: z.enum(['in', 'eq']),
    description: z.string().nullish(),
    attribute: z.string(),
    values: z.union([z.string(), z.array(z.string())])
  })
  .strict()

/**
 * @schema VendorCreateApplicationMethod
 * type: object
 * properties:
 *   description:
 *     type: string
 *     description: Description of the promotion.
 *   value:
 *     type: number
 *     description: The percentage value of the promotion.
 *   max_quantity:
 *     type: string
 *     description: The max quantity of the items.
 *   apply_to_quantity:
 *     type: string
 *     description: Apply to quantity of the items.
 *   buy_rules_min_quantity:
 *     type: string
 *     description: Buy ruyles min quantity of the items.
 *   type:
 *     type: string
 *     enum: [percentage]
 *     description: The type of the application method.
 *   target_type:
 *     type: string
 *     enum: [items]
 *     description: The target type of the application method.
 *   allocation:
 *     type: string
 *     enum: [each,across]
 *     description: The allocation of the application method.
 *   target_rules:
 *     type: array
 *     description: Promotion target rules.
 *     items:
 *       $ref: "#/components/schemas/VendorCreatePromotionRule"
 */
export const VendorCreateApplicationMethod = z
  .object({
    description: z.string().nullish(),
    value: z.number(),
    max_quantity: z.number().nullish(),
    type: z.literal(ApplicationMethodType.PERCENTAGE),
    target_type: z.literal(ApplicationMethodTargetType.ITEMS),
    allocation: z.nativeEnum(ApplicationMethodAllocation),
    target_rules: z.array(VendorCreatePromotionRule),
    apply_to_quantity: z.number().nullish(),
    buy_rules_min_quantity: z.number().nullish()
  })
  .strict()

/**
 * @schema VendorCreatePromotion
 * type: object
 * properties:
 *   code:
 *     type: string
 *     description: The code of the promotion.
 *   is_automatic:
 *     type: boolean
 *     description: Whether the promotion is applied automatically.
 *     default: false
 *   type:
 *     type: string
 *     enum: [standard]
 *     description: The type of the promotion.
 *   application_method:
 *     $ref: "#/components/schemas/VendorCreateApplicationMethod"
 *   rules:
 *     type: array
 *     description: Promotion rules.
 *     items:
 *       $ref: "#/components/schemas/VendorCreatePromotionRule"
 */
export type VendorCreatePromotionType = z.infer<typeof VendorCreatePromotion>
export const VendorCreatePromotion = z
  .object({
    code: z.string(),
    is_automatic: z.boolean().default(false),
    type: z.literal(PromotionType.STANDARD),
    campaign_id: z.string().nullish(),
    application_method: VendorCreateApplicationMethod,
    rules: z.array(VendorCreatePromotionRule).optional()
  })
  .strict()
