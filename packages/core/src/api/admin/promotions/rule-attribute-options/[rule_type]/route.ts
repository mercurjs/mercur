import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ApplicationMethodTargetTypeValues,
  ApplicationMethodTypeValues,
  HttpTypes,
  PromotionTypeValues,
} from "@medusajs/types"

import { getRuleAttributesMap, validateRuleType } from "../../utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminRuleAttributeOptionsListResponse>
) => {
  const { rule_type: ruleType } = req.params

  validateRuleType(ruleType)

  const attributes =
    getRuleAttributesMap({
      promotionType: req.query.promotion_type as PromotionTypeValues,
      applicationMethodType: req.query
        .application_method_type as ApplicationMethodTypeValues,
      applicationMethodTargetType: req.query
        .application_method_target_type as ApplicationMethodTargetTypeValues,
    })[ruleType] || []

  res.json({
    attributes,
  })
}
