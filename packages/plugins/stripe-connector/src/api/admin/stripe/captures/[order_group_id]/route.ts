import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { AdminStripeCaptureResponse } from "../../../../../types/http"
import { refetchCapture } from "../helpers"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse<AdminStripeCaptureResponse>) => {
  res.json({ capture: await refetchCapture(req.scope, req.params.order_group_id, req.queryConfig.fields) })
}
