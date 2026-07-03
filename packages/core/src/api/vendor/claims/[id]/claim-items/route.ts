import { orderClaimItemWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"

import { VendorPostClaimItemsReqType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorPostClaimItemsReqType>,
  res: MedusaResponse<{
    order_preview: HttpTypes.AdminOrderPreview
  }>
) => {
  const { id } = req.params

  const { result } = await orderClaimItemWorkflow(req.scope).run({
    input: { ...req.validatedBody, claim_id: id },
  })

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
  })
}
