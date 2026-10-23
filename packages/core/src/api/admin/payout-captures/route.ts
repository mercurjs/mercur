import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes } from "@mercurjs/types"

import { listPendingCaptures, toAdminCapture } from "../../../workflows/payout/pipeline"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminPayoutCaptureListResponse>
) => {
  const offset = Number(req.query.offset ?? 0)
  const limit = Math.min(Number(req.query.limit ?? 20), 200)
  const all = (await listPendingCaptures(req.scope)).map(toAdminCapture)
  res.json({
    captures: all.slice(offset, offset + limit),
    count: all.length,
    offset,
    limit,
  })
}
