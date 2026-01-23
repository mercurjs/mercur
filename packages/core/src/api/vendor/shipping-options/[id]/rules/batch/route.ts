import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { BatchMethodRequest } from "@medusajs/framework/types"
import { batchShippingOptionRulesWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@mercurjs/types"

import { refetchBatchRules, validateSellerShippingOption } from "../../../helpers"
import {
  VendorCreateShippingOptionRuleType,
  VendorUpdateShippingOptionRuleType,
} from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<
    BatchMethodRequest<
      VendorCreateShippingOptionRuleType,
      VendorUpdateShippingOptionRuleType
    >
  >,
  res: MedusaResponse<HttpTypes.VendorUpdateShippingOptionRulesResponse>
) => {
  const sellerId = req.auth_context.actor_id
  const id = req.params.id

  await validateSellerShippingOption(req.scope, sellerId, id)

  const { result } = await batchShippingOptionRulesWorkflow(req.scope).run({
    input: {
      create: req.validatedBody.create?.map((c) => ({
        ...c,
        shipping_option_id: id,
      })),
      update: req.validatedBody.update,
      delete: req.validatedBody.delete,
    },
  })

  const batchResults = await refetchBatchRules(
    result,
    req.scope,
    req.queryConfig.fields
  )

  res
    .status(200)
    .json(
      batchResults as unknown as HttpTypes.VendorUpdateShippingOptionRulesResponse
    )
}
