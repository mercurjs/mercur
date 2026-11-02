import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { PAYOUT_JOBS, PayoutJobName } from "../../../../../../types/common"
import { AdminPayoutJobRunListResponse } from "../../../../../../types/http"
import { resolveConnector } from "../../../../../../utils/payout-module"

export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, { offset?: number; limit?: number }>,
  res: MedusaResponse<AdminPayoutJobRunListResponse>
) => {
  const job = req.params.job as PayoutJobName
  if (!PAYOUT_JOBS.includes(job)) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Unknown payout job ${job}`)
  }
  const offset = Number(req.query.offset ?? 0)
  const limit = Math.min(Number(req.query.limit ?? 20), 200)
  const [runs, count] = await resolveConnector(req.scope).listAndCountConnectorJobRuns(
    { job },
    { skip: offset, take: limit, order: { started_at: "DESC" } }
  )
  res.json({ runs, count, offset, limit })
}
