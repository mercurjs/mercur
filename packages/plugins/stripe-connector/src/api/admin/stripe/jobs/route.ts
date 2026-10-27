import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { describeJobs } from "../../../../pipeline/jobs"
import { AdminPayoutJobListResponse } from "../../../../types/http"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse<AdminPayoutJobListResponse>) => {
  res.json({ jobs: await describeJobs(req.scope) })
}
