import { batchPromotionRulesWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { BatchMethodRequest } from "@medusajs/framework/types"
import { RuleType } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { refetchBatchRules, validateSellerPromotion } from "../../../helpers"
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

  await validateSellerPromotion(req.scope, req.auth_context.actor_id, id)

  const { result } = await batchPromotionRulesWorkflow(req.scope).run({
    input: {
      id,
      rule_type: RuleType.BUY_RULES,
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
