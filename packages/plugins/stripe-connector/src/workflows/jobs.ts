import { Logger, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createOrRefreshSellerPayoutAccountWorkflow, syncPayoutAccountWorkflow } from "@mercurjs/core/workflows"

import { CaptureStatus, PayoutJobName } from "../types/common"
import { resolveConnector } from "../utils/payout-module"
import { JobStats } from "../utils/run-job"
import { alertFailedOperationsWorkflow } from "./alerts/workflows/alert-failed-operations"
import { failStripeCaptureWorkflow } from "./captures/workflows/fail-stripe-capture"
import { processCapturesWorkflow } from "./captures/workflows/process-captures"
import { settleStripeCaptureWorkflow } from "./captures/workflows/settle-stripe-capture"
import { setStripeCheckpointsWorkflow } from "./common/workflows/set-checkpoints"
import { notifyKycAttentionWorkflow } from "./kyc/workflows/notify-kyc-attention"
import { ONBOARDING_CHECKPOINT } from "./onboarding/utils/onboarding-sellers"
import { selectOnboardingSellersWorkflow } from "./onboarding/workflows/select-onboarding-sellers"
import { processPayoutsWorkflow } from "./payouts/workflows/process-payouts"
import { processReversalsWorkflow } from "./reversals/workflows/process-reversals"
import { processSettlementsWorkflow } from "./settlements/workflows/process-settlements"

export type JobScope = { seller_id?: string; order_id?: string; order_group_id?: string }

const errorMessage = (errors: { error?: { message?: string } | null }[] | undefined) =>
  errors?.[0]?.error?.message ?? "unknown error"

// Jobs that act on many sellers, accounts or payments run one workflow per
// item, so one failing item is recorded and the rest still go through.
async function syncOnboarding(container: MedusaContainer, scope: JobScope): Promise<JobStats> {
  if (!resolveConnector(container).getOptions().onboarding.enabled) {
    return { skipped: "onboarding disabled" }
  }
  const logger = container.resolve<Logger>(ContainerRegistrationKeys.LOGGER)

  const { result: selection } = await selectOnboardingSellersWorkflow(container).run({
    input: { seller_ids: scope.seller_id ? [scope.seller_id] : undefined },
  })

  let processed = 0
  let failed = 0
  for (const sellerId of selection.seller_ids) {
    const { errors } = await createOrRefreshSellerPayoutAccountWorkflow(container).run({
      input: { seller_id: sellerId },
      throwOnError: false,
    })
    if (errors?.length) {
      failed += 1
      logger.error(`Could not prepare payout account for seller ${sellerId}: ${errorMessage(errors)}`)
    } else {
      processed += 1
    }
  }

  if (selection.checkpoint) {
    await setStripeCheckpointsWorkflow(container).run({
      input: { checkpoints: [{ key: ONBOARDING_CHECKPOINT, value: selection.checkpoint }] },
    })
  }

  return {
    sellers: selection.seller_ids.length,
    processed,
    failed,
    ...(selection.checkpoint ? { checkpoint: selection.checkpoint } : {}),
  }
}

async function validateCaptures(container: MedusaContainer, scope: JobScope): Promise<JobStats> {
  const logger = container.resolve<Logger>(ContainerRegistrationKeys.LOGGER)
  const { result } = await processCapturesWorkflow(container).run({ input: { order_group_id: scope.order_group_id } })

  const settled: Record<string, number> = { captured: 0, canceled: 0, failed: 0 }
  for (const row of result.settle) {
    const { errors } = await settleStripeCaptureWorkflow(container).run({
      input: { order_group_id: row.order_group_id, action: row.action },
      throwOnError: false,
    })
    if (errors?.length) {
      const reason = errorMessage(errors)
      logger.error(`Could not ${row.action} the payment of order group ${row.order_group_id}: ${reason}`)
      await failStripeCaptureWorkflow(container).run({ input: { id: row.capture_id, status_reason: reason } })
      settled.failed += 1
    } else {
      settled[row.action === "capture" ? CaptureStatus.CAPTURED : CaptureStatus.CANCELED] += 1
    }
  }

  return { ...result.stats, ...settled }
}

async function monitorKyc(container: MedusaContainer): Promise<JobStats> {
  if (!resolveConnector(container).getOptions().kycMonitor.enabled) {
    return { skipped: "kyc monitor disabled" }
  }
  const logger = container.resolve<Logger>(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: accounts } = await query.graph({
    entity: "payout_account",
    fields: ["id"],
    filters: { external_id: { $ne: null } },
  })

  const synced: string[] = []
  for (const account of accounts) {
    const { errors } = await syncPayoutAccountWorkflow(container).run({
      input: { id: account.id },
      throwOnError: false,
    })
    if (errors?.length) {
      logger.error(`Could not sync payout account ${account.id}: ${errorMessage(errors)}`)
    } else {
      synced.push(account.id)
    }
  }

  const { result } = await notifyKycAttentionWorkflow(container).run({ input: { account_ids: synced } })
  return { accounts: accounts.length, synced: synced.length, ...result }
}

export const jobWorkflow = (
  job: PayoutJobName,
  container: MedusaContainer,
  scope: JobScope = {}
): (() => Promise<JobStats>) => {
  const workflows: Record<PayoutJobName, () => Promise<JobStats>> = {
    "payout-sync-onboarding": () => syncOnboarding(container, scope),
    "payout-validate-captures": () => validateCaptures(container, scope),
    "payout-process-transfers": async () =>
      (
        await processPayoutsWorkflow(container).run({
          input: { order_ids: scope.order_id ? [scope.order_id] : undefined },
        })
      ).result,
    "payout-process-reversals": async () =>
      (
        await processReversalsWorkflow(container).run({
          input: { order_ids: scope.order_id ? [scope.order_id] : undefined },
        })
      ).result,
    "payout-process-settlements": async () =>
      (await processSettlementsWorkflow(container).run({ input: { seller_id: scope.seller_id } })).result,
    "payout-alert-failed-operations": async () => (await alertFailedOperationsWorkflow(container).run()).result,
    "payout-monitor-kyc": () => monitorKyc(container),
  }
  return workflows[job]
}
