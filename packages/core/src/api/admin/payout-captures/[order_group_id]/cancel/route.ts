import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { listPendingCaptures, toAdminCapture } from "../../../../../workflows/payout/pipeline"
import { cancelPendingPaymentWorkflow } from "../../../../../workflows/payout"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<{ capture: HttpTypes.AdminPayoutCapture }>
) => {
  const item = (await listPendingCaptures(req.scope)).find((c) => c.group.id === req.params.order_group_id)
  if (!item) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `No pending capture for order group ${req.params.order_group_id}`)
  }

  await cancelPendingPaymentWorkflow(req.scope).run({
    input: { payment_id: item.payment.id, payment_collection_id: item.collection.id },
  })

  res.json({ capture: toAdminCapture(item) })
}
