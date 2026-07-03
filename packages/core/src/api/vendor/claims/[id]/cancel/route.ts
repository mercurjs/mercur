import { cancelOrderClaimWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { VendorPostCancelClaimReqType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorPostCancelClaimReqType>,
  res: MedusaResponse<HttpTypes.AdminClaimResponse>
) => {
  const { id } = req.params

  const { result } = await cancelOrderClaimWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      claim_id: id,
      canceled_by: req.seller_context!.seller_id,
    },
  })

  res.status(200).json({ claim: result as HttpTypes.AdminClaim })
}
