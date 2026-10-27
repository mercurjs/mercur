import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { toAdminCapture } from "../../../../../../pipeline/captures"
import { AdminPayoutCaptureResponse } from "../../../../../../types/http"
import { capturePendingPaymentWorkflow } from "../../../../../../workflows/capture-pending-payment"
import { retrievePendingCapture } from "../../helpers"

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse<AdminPayoutCaptureResponse>) => {
  const item = await retrievePendingCapture(req.scope, req.params.order_group_id)

  await capturePendingPaymentWorkflow(req.scope).run({
    input: {
      payment_id: item.payment.id,
      payment_collection_id: item.collection.id,
      amount: item.decision.capturable_amount,
    },
  })

  res.json({ capture: toAdminCapture(item) })
}
