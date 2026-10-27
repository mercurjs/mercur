import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { listPendingCaptures, toAdminCapture } from "../../../../pipeline/captures"
import { AdminPayoutCaptureListResponse } from "../../../../types/http"
import { resolveConnector } from "../../../../utils/payout-module"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse<AdminPayoutCaptureListResponse>) => {
  const offset = Number(req.query.offset ?? 0)
  const limit = Math.min(Number(req.query.limit ?? 20), 200)
  const all = (await listPendingCaptures(req.scope, resolveConnector(req.scope).getOptions())).map(toAdminCapture)
  res.json({
    captures: all.slice(offset, offset + limit),
    count: all.length,
    offset,
    limit,
  })
}
