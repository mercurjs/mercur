import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { AdminStripeCaptureResponse } from "../../../../../../types/http"
import { settleOrderGroupPaymentWorkflow } from "../../../../../../workflows/captures/workflows/settle-order-group-payment"
import { refetchCapture } from "../../helpers"

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse<AdminStripeCaptureResponse>) => {
  await settleOrderGroupPaymentWorkflow(req.scope).run({
    input: { order_group_id: req.params.order_group_id, action: "cancel" },
  })

  res.json({ capture: await refetchCapture(req.scope, req.params.order_group_id, req.queryConfig.fields) })
}
