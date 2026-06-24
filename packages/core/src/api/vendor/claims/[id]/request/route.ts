import { cancelBeginOrderClaimWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { confirmClaimRequestWorkflow } from "../../../../../workflows/order/workflows/confirm-claim-request"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<{
    order_preview: HttpTypes.AdminOrderPreview
  }>
) => {
  const { id } = req.params

  const { result } = await confirmClaimRequestWorkflow(req.scope).run({
    input: {
      claim_id: id,
      confirmed_by: req.seller_context!.seller_id,
    },
  })

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
  })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminClaimDeleteResponse>
) => {
  const { id } = req.params

  await cancelBeginOrderClaimWorkflow(req.scope).run({
    input: { claim_id: id },
  })

  res.status(200).json({
    id,
    object: "claim",
    deleted: true,
  })
}
