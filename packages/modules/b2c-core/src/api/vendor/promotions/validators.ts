import { z } from "zod";

import {
  ApplicationMethodAllocation,
  ApplicationMethodTargetType,
  ApplicationMethodType,
  PromotionStatus,
  PromotionType,
  RuleType,
} from "@medusajs/framework/utils";
import {
  ApplicationMethodTargetTypeValues,
  ApplicationMethodTypeValues,
  PromotionTypeValues,
  RuleTypeValues,
} from "@medusajs/types";
import {
  createFindParams,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators";

import { VendorCreateCampaign } from "../campaigns/validators";

export type VendorGetPromotionsParamsType = z.infer<
  typeof VendorGetPromotionsParams
>;
export const VendorGetPromotionsParams = createFindParams({
  offset: 0,
  limit: 50,
});

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
    operator: z.enum(["in", "eq"]),
    description: z.string().nullish(),
    attribute: z.string(),
    values: z.union([z.string(), z.array(z.string())]),
  })
  .strict();

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
    buy_rules_min_quantity: z.number().nullish(),
  })
  .strict();

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
 *   status:
 *     type: string
 *     enum: [draft,active,inactive]
 *     description: The status of the promotion.
 *   campaign_id:
 *     type: string
 *     description: The campaign id.
 *   campaign:
 *     $ref: "#/components/schemas/VendorCreateCampaign"
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
export type VendorCreatePromotionType = z.infer<typeof VendorCreatePromotion>;
export const VendorCreatePromotion = z
  .object({
    code: z.string(),
    status: z.nativeEnum(PromotionStatus).default(PromotionStatus.DRAFT),
    is_automatic: z.boolean().default(false),
    type: z.literal(PromotionType.STANDARD),
    campaign_id: z.string().nullish(),
    campaign: VendorCreateCampaign.optional(),
    application_method: VendorCreateApplicationMethod,
    rules: z.array(VendorCreatePromotionRule).optional(),
  })
  .strict();

/**
 * @schema VendorBatchPromotionRule
 * type: object
 * properties:
 *   create:
 *     type: array
 *     description: Rules to create.
 *     items:
 *       $ref: "#/components/schemas/VendorCreatePromotionRule"
 *   delete:
 *     type: array
 *     description: Rules to delete.
 *     items:
 *       type: string
 */
export type VendorBatchPromotionRulesType = z.infer<
  typeof VendorBatchPromotionRules
>;
export const VendorBatchPromotionRules = z.object({
  create: z.array(VendorCreatePromotionRule).default([]),
  delete: z.array(z.string()).default([]),
});

/**
 * @schema VendorUpdateApplicationMethod
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
 *   currency_code:
 *     type: string
 *     description: The currency code.
 *   apply_to_quantity:
 *     type: string
 *     description: Apply to quantity of the items.
 *   buy_rules_min_quantity:
 *     type: string
 *     description: Buy ruyles min quantity of the items.
 */
export type VendorUpdateApplicationMethodType = z.infer<
  typeof VendorUpdateApplicationMethod
>;
export const VendorUpdateApplicationMethod = z
  .object({
    description: z.string().nullish(),
    value: z.number().optional(),
    max_quantity: z.number().nullish(),
    currency_code: z.string().nullish(),
    apply_to_quantity: z.number().nullish(),
    buy_rules_min_quantity: z.number().nullish(),
  })
  .strict();

/**
 * @schema VendorUpdatePromotion
 * type: object
 * properties:
 *   code:
 *     type: string
 *     description: The code of the promotion.
 *   is_automatic:
 *     type: boolean
 *     description: Whether the promotion is applied automatically.
 *     default: false
 *   campaign_id:
 *     type: string
 *     description: The campaign id.
 *   status:
 *     type: string
 *     enum: [draft,active,inactive]
 *     description: The status of the promotion.
 *   application_method:
 *     $ref: "#/components/schemas/VendorUpdateApplicationMethod"
 */
export type VendorUpdatePromotionType = z.infer<typeof VendorUpdatePromotion>;
export const VendorUpdatePromotion = z
  .object({
    code: z.string().optional(),
    is_automatic: z.boolean().optional(),
    status: z.nativeEnum(PromotionStatus).optional(),
    campaign_id: z.string().nullish(),
    application_method: VendorUpdateApplicationMethod.optional(),
  })
  .strict();

export type VendorGetPromotionsRuleValueParamsType = z.infer<
  typeof VendorGetPromotionsRuleValueParams
>;
export const VendorGetPromotionsRuleValueParams = createFindParams({
  limit: 100,
  offset: 0,
}).merge(
  z.object({
    q: z.string().optional(),
    value: z.union([z.string(), z.array(z.string())]).optional(),
  })
);

export type VendorGetPromotionRuleParamsType = z.infer<
  typeof VendorGetPromotionRuleParams
>;
export const VendorGetPromotionRuleParams = z.object({
  promotion_type: z.nativeEnum(PromotionType).optional(),
  application_method_type: z.nativeEnum(ApplicationMethodType).optional(),
});

export type VendorGetPromotionRuleTypeParamsType = z.infer<
  typeof VendorGetPromotionRuleTypeParams
>;
export const VendorGetPromotionRuleTypeParams = createSelectParams().merge(
  z.object({
    promotion_type: z.nativeEnum(PromotionType).optional(),
    application_method_type: z.nativeEnum(ApplicationMethodType).optional(),
  })
);

export const VendorGetPromotionsRuleValuePathParams = z.object({
  rule_type: z.nativeEnum(RuleType),
  rule_attribute_id: z.string(),
  promotion_type: z.nativeEnum(PromotionType).optional(),
  application_method_type: z.nativeEnum(ApplicationMethodType).optional(),
});
