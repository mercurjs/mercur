import { batchPromotionRulesWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { BatchMethodRequest } from "@medusajs/framework/types"
import { RuleType } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import {
  refetchBatchRules,
  validatePromotionRules,
  validateSellerPromotion,
} from "../../../helpers"
import {
  VendorCreatePromotionRuleType,
  VendorUpdatePromotionRuleType,
} from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<
    BatchMethodRequest<VendorCreatePromotionRuleType, VendorUpdatePromotionRuleType>
  >,
  res: MedusaResponse<HttpTypes.VendorPromotionRuleBatchResponse>
) => {
  const { id } = req.params

  await validateSellerPromotion(req.scope, req.seller_context!.seller_id, id)
  await validatePromotionRules(req.scope, id, RuleType.TARGET_RULES, [
    ...(req.validatedBody.update ?? []).map((rule) => rule.id),
    ...(req.validatedBody.delete ?? []),
  ])

  const { result } = await batchPromotionRulesWorkflow(req.scope).run({
    input: {
      id,
      rule_type: RuleType.TARGET_RULES,
      create: req.validatedBody.create,
      update: req.validatedBody.update,
      delete: req.validatedBody.delete,
    },
  })

  const batchResults = await refetchBatchRules(
    result,
    req.scope,
    req.queryConfig.fields
  )

  res.json(batchResults)
}
