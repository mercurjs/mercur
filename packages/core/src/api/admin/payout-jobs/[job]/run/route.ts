import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { HttpTypes, PAYOUT_JOBS, PayoutJobName, PayoutJobTrigger } from "@mercurjs/types"

import {
  alertFailedOperations,
  monitorKyc,
  processReversals,
  processSettlements,
  processTransfers,
  syncOnboarding,
  validateCaptures,
} from "../../../../../workflows/payout/pipeline"
import { PayoutJobContext, runPayoutJob } from "../../../../../workflows/payout/utils/run-payout-job"

type RunBody = { seller_id?: string; order_id?: string; order_group_id?: string }

export const POST = async (
  req: AuthenticatedMedusaRequest<RunBody>,
  res: MedusaResponse<HttpTypes.AdminPayoutJobRunResponse>
) => {
  const job = req.params.job as PayoutJobName
  if (!PAYOUT_JOBS.includes(job)) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Unknown payout job ${job}`)
  }
  const body = (req.body ?? {}) as RunBody

  const fn: Record<PayoutJobName, (ctx: PayoutJobContext) => Promise<void>> = {
    "payout-sync-onboarding": (ctx) => syncOnboarding(ctx, body.seller_id ? [body.seller_id] : undefined),
    "payout-validate-captures": (ctx) => validateCaptures(ctx, body.order_group_id),
    "payout-process-transfers": (ctx) => processTransfers(ctx, body.order_id ? [body.order_id] : undefined),
    "payout-process-reversals": (ctx) => processReversals(ctx, body.order_id ? [body.order_id] : undefined),
    "payout-process-settlements": (ctx) => processSettlements(ctx, body.seller_id),
    "payout-alert-failed-operations": (ctx) => alertFailedOperations(ctx),
    "payout-monitor-kyc": (ctx) => monitorKyc(ctx),
  }

  const run = await runPayoutJob(req.scope, job, PayoutJobTrigger.MANUAL, fn[job])
  if (!run) {
    res.status(409).json({ message: `${job} is already running` } as never)
    return
  }
  res.json({ run })
}
