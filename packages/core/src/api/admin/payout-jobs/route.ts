import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes } from "@mercurjs/types"

import { describePayoutJobs } from "../../utils/payout-jobs"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminPayoutJobListResponse>
) => {
  res.json({ jobs: await describePayoutJobs(req.scope) })
}
