import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { JobRunScope, jobHandler } from "../../../../../../pipeline/jobs"
import { JobTrigger, PAYOUT_JOBS, PayoutJobName } from "../../../../../../types/common"
import { AdminPayoutJobRunResponse } from "../../../../../../types/http"
import { runJob } from "../../../../../../utils/run-job"
import { AdminRunJobType } from "../../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminRunJobType>,
  res: MedusaResponse<AdminPayoutJobRunResponse>
) => {
  const job = req.params.job as PayoutJobName
  if (!PAYOUT_JOBS.includes(job)) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Unknown payout job ${job}`)
  }
  const scope: JobRunScope = req.validatedBody ?? {}

  const run = await runJob(req.scope, job, JobTrigger.MANUAL, jobHandler(job, scope))
  if (!run) {
    throw new MedusaError(MedusaError.Types.CONFLICT, `${job} is already running`)
  }
  res.json({ run })
}
