import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { HttpTypes, MercurModules, PAYOUT_JOBS, PayoutJobName } from "@mercurjs/types"

import PayoutModuleService from "../../../../../modules/payout/services/payout-module-service"

export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, { offset?: number; limit?: number }>,
  res: MedusaResponse<HttpTypes.AdminPayoutJobRunListResponse>
) => {
  const job = req.params.job as PayoutJobName
  if (!PAYOUT_JOBS.includes(job)) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Unknown payout job ${job}`)
  }
  const service = req.scope.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  const offset = Number(req.query.offset ?? 0)
  const limit = Math.min(Number(req.query.limit ?? 20), 200)
  const [runs, count] = await service.listAndCountPayoutJobRuns(
    { job },
    { skip: offset, take: limit, order: { started_at: "DESC" } }
  )
  res.json({ runs, count, offset, limit })
}
