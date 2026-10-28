import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  StepResponse,
  WorkflowResponse,
  createStep,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import { sendNotificationsStep } from "@medusajs/medusa/core-flows"
import { PayoutKycStatus } from "@mercurjs/types"
import { syncPayoutAccountWorkflow } from "@mercurjs/core/workflows"

import { resolveConnector, resolvePayoutModule } from "../../utils/payout-module"
import { JobStats } from "../../utils/run-job"

type Attention = { account_id: string; kyc_status: string | null; disabled_reason: string | null }

const syncProviderAccountsStep = createStep("sync-stripe-provider-accounts", async (_, { container }) => {
  const connector = resolveConnector(container)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const { kycMonitor, alerting } = connector.getOptions()

  if (!kycMonitor.enabled) {
    return new StepResponse({
      attention: [] as Attention[],
      email: null as string | null,
      from: null as string | null,
      stats: { skipped: "kyc monitor disabled" } as Record<string, number | string>,
    })
  }

  const accounts = await resolvePayoutModule(container).listPayoutAccounts(
    { external_id: { $ne: null } },
    { take: null, select: ["id"] }
  )

  const attention: Attention[] = []
  let synced = 0
  for (const account of accounts) {
    const { result, errors } = await syncPayoutAccountWorkflow(container).run({
      input: { id: account.id },
      throwOnError: false,
    })
    if (errors?.length) {
      logger.error(`Could not sync payout account ${account.id}: ${errors[0].error?.message}`)
      continue
    }
    synced += 1
    if (result.kyc_status && result.kyc_status !== PayoutKycStatus.APPROVED) {
      attention.push({ account_id: result.id, kyc_status: result.kyc_status, disabled_reason: result.disabled_reason })
    }
  }

  return new StepResponse({
    attention,
    email: alerting.technicalEmail ?? null,
    from: alerting.from ?? null,
    stats: { accounts: accounts.length, synced, attention: attention.length } as Record<string, number | string>,
  })
})

export const monitorKycWorkflowId = "monitor-stripe-kyc"

/** Re-reads every provider account, refreshes its KYC status, and mails the accounts that still need something. */
export const monitorKycWorkflow = createWorkflow(monitorKycWorkflowId, function () {
  const synced = syncProviderAccountsStep()

  const notifications = transform({ synced }, ({ synced }) =>
    synced.attention.length && synced.email
      ? [
          {
            to: synced.email,
            from: synced.from,
            channel: "email",
            template: "payout-kyc-required",
            data: { accounts: synced.attention },
            content: {
              subject: `[Payouts] ${synced.attention.length} account(s) need KYC attention`,
              text: synced.attention
                .map((row) => `- ${row.account_id}: ${row.kyc_status}${row.disabled_reason ? ` (${row.disabled_reason})` : ""}`)
                .join("\n"),
            },
          },
        ]
      : []
  )

  when({ notifications }, ({ notifications }) => notifications.length > 0).then(() => {
    sendNotificationsStep(notifications)
  })

  const stats = transform({ synced, notifications }, ({ synced, notifications }): JobStats => ({
    ...synced.stats,
    sent: notifications.length,
  }))

  return new WorkflowResponse(stats)
})
