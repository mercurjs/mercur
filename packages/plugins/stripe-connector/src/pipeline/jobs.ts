import { MedusaContainer } from "@medusajs/framework/types"
import { PayoutStatus } from "@mercurjs/types"

import { PAYOUT_JOBS, PAYOUT_JOB_SCHEDULES, PayoutJobName } from "../types/common"
import { AdminPayoutJob } from "../types/http"
import { nextCronRun } from "../utils/cron"
import { resolveConnector, resolvePayoutModule } from "../utils/payout-module"
import { JobContext } from "../utils/run-job"
import { alertFailedOperations } from "./alerts"
import { validateCaptures } from "./captures"
import { monitorKyc } from "./kyc"
import { ONBOARDING_CHECKPOINT, syncOnboarding } from "./onboarding"
import { processReversals } from "./reversals"
import { processSettlements } from "./settlements"
import { TRANSFERS_CHECKPOINT, processTransfers } from "./transfers"

export type JobRunScope = { seller_id?: string; order_id?: string; order_group_id?: string }

export const jobHandler = (
  job: PayoutJobName,
  scope: JobRunScope = {}
): ((ctx: JobContext) => Promise<void>) => {
  const handlers: Record<PayoutJobName, (ctx: JobContext) => Promise<void>> = {
    "payout-sync-onboarding": (ctx) => syncOnboarding(ctx, scope.seller_id ? [scope.seller_id] : undefined),
    "payout-validate-captures": (ctx) => validateCaptures(ctx, scope.order_group_id),
    "payout-process-transfers": (ctx) => processTransfers(ctx, scope.order_id ? [scope.order_id] : undefined),
    "payout-process-reversals": (ctx) => processReversals(ctx, scope.order_id ? [scope.order_id] : undefined),
    "payout-process-settlements": (ctx) => processSettlements(ctx, scope.seller_id),
    "payout-alert-failed-operations": (ctx) => alertFailedOperations(ctx),
    "payout-monitor-kyc": (ctx) => monitorKyc(ctx),
  }
  return handlers[job]
}

const CHECKPOINT_BY_JOB: Partial<Record<PayoutJobName, string>> = {
  "payout-sync-onboarding": ONBOARDING_CHECKPOINT,
  "payout-process-transfers": TRANSFERS_CHECKPOINT,
}

export async function countFailed(container: MedusaContainer) {
  const payoutModule = resolvePayoutModule(container)
  const connector = resolveConnector(container)
  const [payouts, reversals, settlements, adjustments] = await Promise.all([
    payoutModule.listPayouts({ status: PayoutStatus.FAILED }, { select: ["id"], take: null }),
    payoutModule.listPayoutReversals({ status: PayoutStatus.FAILED }, { select: ["id"], take: null }),
    connector.listSettlements({ payout_status: PayoutStatus.FAILED }, { select: ["id"], take: null }),
    connector.listAdjustments({ status: PayoutStatus.FAILED }, { select: ["id"], take: null }),
  ])
  return {
    payouts: payouts.length,
    reversals: reversals.length,
    settlements: settlements.length,
    adjustments: adjustments.length,
  }
}

export async function describeJobs(container: MedusaContainer): Promise<AdminPayoutJob[]> {
  const connector = resolveConnector(container)
  const options = connector.getOptions()

  const enabled: Record<PayoutJobName, boolean> = {
    "payout-sync-onboarding": options.onboarding.enabled,
    "payout-validate-captures": true,
    "payout-process-transfers": options.transfers.enabled,
    "payout-process-reversals": options.reversals.enabled,
    "payout-process-settlements": options.settlements.enabled,
    "payout-alert-failed-operations": true,
    "payout-monitor-kyc": options.kycMonitor.enabled,
  }

  const failed = await countFailed(container)
  const failedByJob: Partial<Record<PayoutJobName, number>> = {
    "payout-process-transfers": failed.payouts,
    "payout-process-reversals": failed.reversals,
    "payout-process-settlements": failed.settlements + failed.adjustments,
  }

  const jobs: AdminPayoutJob[] = []
  for (const job of PAYOUT_JOBS) {
    const [lastRun] = await connector.listConnectorJobRuns({ job }, { take: 1, order: { started_at: "DESC" } })
    const checkpointKey = CHECKPOINT_BY_JOB[job]
    jobs.push({
      job,
      schedule: PAYOUT_JOB_SCHEDULES[job],
      enabled: enabled[job],
      checkpoint: checkpointKey ? await connector.getCheckpoint(checkpointKey) : null,
      last_run: lastRun ?? null,
      next_run_at: enabled[job] ? nextCronRun(PAYOUT_JOB_SCHEDULES[job], new Date()) : null,
      failed_count: failedByJob[job] ?? 0,
    })
  }
  return jobs
}
