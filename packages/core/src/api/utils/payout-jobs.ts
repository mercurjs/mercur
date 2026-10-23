import { MedusaContainer } from "@medusajs/framework/types"
import {
  HttpTypes,
  MercurModules,
  PAYOUT_JOBS,
  PAYOUT_JOB_SCHEDULES,
  PayoutJobName,
  PayoutStatus,
  TransferStatus,
  TransferType,
} from "@mercurjs/types"

import PayoutModuleService from "../../modules/payout/services/payout-module-service"
import { ONBOARDING_CHECKPOINT, TRANSFERS_CHECKPOINT } from "../../workflows/payout/pipeline"
import { nextCronRun } from "./cron"

const CHECKPOINT_BY_JOB: Partial<Record<PayoutJobName, string>> = {
  "payout-sync-onboarding": ONBOARDING_CHECKPOINT,
  "payout-process-transfers": TRANSFERS_CHECKPOINT,
}

export async function describePayoutJobs(container: MedusaContainer): Promise<HttpTypes.AdminPayoutJob[]> {
  const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  const options = service.getOptions()

  const enabled: Record<PayoutJobName, boolean> = {
    "payout-sync-onboarding": options.onboarding.enabled,
    "payout-validate-captures": true,
    "payout-process-transfers": options.transfers.enabled,
    "payout-process-reversals": options.reversals.enabled,
    "payout-process-settlements": options.settlements.enabled,
    "payout-alert-failed-operations": true,
    "payout-monitor-kyc": options.kycMonitor.enabled,
  }

  const [failedTransfers, failedReversals, failedPayouts] = await Promise.all([
    service.listTransfers(
      { status: TransferStatus.FAILED, type: [TransferType.ORDER, TransferType.TAX, TransferType.ADJUSTMENT_CREDIT, TransferType.ADJUSTMENT_DEBIT] },
      { select: ["id"], take: null }
    ),
    service.listTransfers({ status: TransferStatus.FAILED, type: TransferType.REFUND_REVERSAL }, { select: ["id"], take: null }),
    service.listPayouts({ status: PayoutStatus.FAILED }, { select: ["id"], take: null }),
  ])

  const failedByJob: Partial<Record<PayoutJobName, number>> = {
    "payout-process-transfers": failedTransfers.length,
    "payout-process-reversals": failedReversals.length,
    "payout-process-settlements": failedPayouts.length,
  }

  const jobs: HttpTypes.AdminPayoutJob[] = []
  for (const job of PAYOUT_JOBS) {
    const [lastRun] = await service.listPayoutJobRuns({ job }, { take: 1, order: { started_at: "DESC" } })
    const checkpointKey = CHECKPOINT_BY_JOB[job]
    jobs.push({
      job,
      schedule: PAYOUT_JOB_SCHEDULES[job],
      enabled: enabled[job],
      checkpoint: checkpointKey ? await service.getCheckpoint(checkpointKey) : null,
      last_run: lastRun ?? null,
      next_run_at: enabled[job] ? nextCronRun(PAYOUT_JOB_SCHEDULES[job], new Date()) : null,
      failed_count: failedByJob[job] ?? 0,
    })
  }
  return jobs
}
