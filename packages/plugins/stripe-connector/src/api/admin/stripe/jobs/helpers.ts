import { MedusaContainer } from "@medusajs/framework/types"
import { PayoutStatus } from "@mercurjs/types"

import { CaptureStatus, PAYOUT_JOBS, PAYOUT_JOB_SCHEDULES, PayoutJobName } from "../../../../types/common"
import { AdminPayoutJob } from "../../../../types/http"
import { nextCronRun } from "../../../../utils/cron"
import { resolveConnector, resolvePayoutModule } from "../../../../utils/payout-module"
import { ONBOARDING_CHECKPOINT } from "../../../../workflows/onboarding/sync-onboarding"
import { PAYOUTS_CHECKPOINT } from "../../../../workflows/payouts/steps/select-payout-orders"

const COUNT_ONLY = { take: 1, select: ["id"] }

export async function countFailed(container: MedusaContainer) {
  const payoutModule = resolvePayoutModule(container)
  const connector = resolveConnector(container)
  const [[, captures], [, payouts], [, reversals], [, settlements], [, adjustments]] = await Promise.all([
    connector.listAndCountStripeCaptures({ status: CaptureStatus.FAILED }, COUNT_ONLY),
    payoutModule.listAndCountPayouts({ status: PayoutStatus.FAILED }, COUNT_ONLY),
    payoutModule.listAndCountPayoutReversals({ status: PayoutStatus.FAILED }, COUNT_ONLY),
    connector.listAndCountSettlements({ payout_status: PayoutStatus.FAILED }, COUNT_ONLY),
    connector.listAndCountAdjustments({ status: PayoutStatus.FAILED }, COUNT_ONLY),
  ])
  return { captures, payouts, reversals, settlements, adjustments }
}

const CHECKPOINT_BY_JOB: Partial<Record<PayoutJobName, string>> = {
  "payout-sync-onboarding": ONBOARDING_CHECKPOINT,
  "payout-process-transfers": PAYOUTS_CHECKPOINT,
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
    "payout-validate-captures": failed.captures,
    "payout-process-transfers": failed.payouts,
    "payout-process-reversals": failed.reversals,
    "payout-process-settlements": failed.settlements + failed.adjustments,
  }

  return await Promise.all(
    PAYOUT_JOBS.map(async (job) => {
      const [lastRun] = await connector.listConnectorJobRuns({ job }, { take: 1, order: { started_at: "DESC" } })
      const checkpointKey = CHECKPOINT_BY_JOB[job]
      return {
        job,
        schedule: PAYOUT_JOB_SCHEDULES[job],
        enabled: enabled[job],
        checkpoint: checkpointKey ? await connector.getCheckpoint(checkpointKey) : null,
        last_run: lastRun ?? null,
        next_run_at: enabled[job] ? nextCronRun(PAYOUT_JOB_SCHEDULES[job], new Date()) : null,
        failed_count: failedByJob[job] ?? 0,
      }
    })
  )
}
