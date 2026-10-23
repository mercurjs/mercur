import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes, PayoutJobTrigger } from "@mercurjs/types"

import { processSettlements } from "../../../../workflows/payout/pipeline"
import { runPayoutJob } from "../../../../workflows/payout/utils/run-payout-job"
import { AdminRunPayoutsType } from "../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminRunPayoutsType>,
  res: MedusaResponse<HttpTypes.AdminPayoutJobRunResponse>
) => {
  const run = await runPayoutJob(req.scope, "payout-process-settlements", PayoutJobTrigger.MANUAL, (ctx) =>
    processSettlements(ctx, req.validatedBody?.seller_id)
  )

  if (!run) {
    res.status(409).json({ message: "A settlement run is already in progress" } as never)
    return
  }

  res.json({ run })
}
