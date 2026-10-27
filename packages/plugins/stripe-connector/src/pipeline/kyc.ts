import { INotificationModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { PayoutKycStatus } from "@mercurjs/types"
import { syncPayoutAccountWorkflow } from "@mercurjs/core/workflows"

import { resolvePayoutModule } from "../utils/payout-module"
import { JobContext } from "../utils/run-job"

/**
 * Re-reads every provider account, refreshes its KYC status, and mails the
 * list of accounts that still need something.
 */
export async function monitorKyc(ctx: JobContext) {
  const { container, options, stats, logger } = ctx

  if (!options.kycMonitor.enabled) {
    stats.skipped = "kyc monitor disabled"
    return
  }

  const accounts = await resolvePayoutModule(container).listPayoutAccounts(
    { external_id: { $ne: null } },
    { take: null }
  )
  stats.accounts = accounts.length

  const attention: { account_id: string; kyc_status: string | null; disabled_reason: string | null }[] = []
  let synced = 0

  for (const account of accounts) {
    const { result, errors } = await syncPayoutAccountWorkflow(container).run({
      input: { account_id: account.id },
      throwOnError: false,
    })
    if (errors?.length) {
      logger.error(`Could not sync payout account ${account.id}: ${errors[0].error?.message}`)
      continue
    }
    synced += 1
    if (result.kyc_status && result.kyc_status !== PayoutKycStatus.APPROVED) {
      attention.push({
        account_id: result.id,
        kyc_status: result.kyc_status,
        disabled_reason: result.disabled_reason,
      })
    }
  }

  stats.synced = synced
  stats.attention = attention.length

  const email = options.alerting.technicalEmail
  if (!attention.length || !email) {
    return
  }

  const notificationService = container.resolve<INotificationModuleService>(Modules.NOTIFICATION)
  await notificationService.createNotifications({
    to: email,
    from: options.alerting.from,
    channel: "email",
    template: "payout-kyc-required",
    data: { accounts: attention },
    content: {
      subject: `[Payouts] ${attention.length} account(s) need KYC attention`,
      text: attention
        .map((row) => `- ${row.account_id}: ${row.kyc_status}${row.disabled_reason ? ` (${row.disabled_reason})` : ""}`)
        .join("\n"),
    },
  })
  stats.sent = 1
}
