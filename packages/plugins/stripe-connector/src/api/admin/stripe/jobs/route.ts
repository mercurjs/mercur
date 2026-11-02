import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { AdminPayoutJobListResponse } from "../../../../types/http"
import { describeJobs } from "./helpers"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse<AdminPayoutJobListResponse>) => {
  res.json({ jobs: await describeJobs(req.scope) })
}
