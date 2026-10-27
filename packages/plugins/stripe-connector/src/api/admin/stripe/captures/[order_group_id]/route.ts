import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { toAdminCapture } from "../../../../../pipeline/captures"
import { AdminPayoutCaptureResponse } from "../../../../../types/http"
import { retrievePendingCapture } from "../helpers"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse<AdminPayoutCaptureResponse>) => {
  const item = await retrievePendingCapture(req.scope, req.params.order_group_id)
  res.json({ capture: toAdminCapture(item) })
}
