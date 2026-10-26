import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { listPendingCaptures, toAdminCapture } from "../../../../workflows/payout/pipeline"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminPayoutCaptureResponse>
) => {
  const item = (await listPendingCaptures(req.scope)).find((c) => c.group.id === req.params.order_group_id)
  if (!item) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `No pending capture for order group ${req.params.order_group_id}`)
  }

  res.json({ capture: toAdminCapture(item) })
}
