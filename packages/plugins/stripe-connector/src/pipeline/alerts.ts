import { INotificationModuleService, MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { PayoutStatus } from "@mercurjs/types"

import { CAPTURE_ERROR_KEY, ResolvedStripeConnectorOptions } from "../types/common"
import { resolveConnector, resolvePayoutModule } from "../utils/payout-module"
import { JobContext } from "../utils/run-job"
import { listPendingCaptures } from "./captures"

export type FailedOperations = {
  captures: { order_group_id: string; payment_id: string; error: string }[]
  payouts: { id: string; order_id: string | null; amount: unknown; currency_code: string; status_reason: string | null }[]
  reversals: { id: string; payout_id: string; refund_id: string | null; amount: unknown; status_reason: string | null }[]
  settlements: { id: string; account_id: string; amount: unknown; currency_code: string; status_reason: string | null }[]
  adjustments: { id: string; account_id: string; amount: unknown; currency_code: string; status_reason: string | null }[]
}

export async function collectFailedOperations(
  container: MedusaContainer,
  options: ResolvedStripeConnectorOptions
): Promise<FailedOperations> {
  const payoutModule = resolvePayoutModule(container)
  const connector = resolveConnector(container)

  const pending = await listPendingCaptures(container, options)
  const [payouts, reversals, settlements, adjustments] = await Promise.all([
    payoutModule.listPayouts({ status: PayoutStatus.FAILED }, { take: null }),
    payoutModule.listPayoutReversals({ status: PayoutStatus.FAILED }, { take: null }),
    connector.listSettlements({ payout_status: PayoutStatus.FAILED }, { take: null }),
    connector.listAdjustments({ status: PayoutStatus.FAILED }, { take: null }),
  ])

  return {
    captures: pending
      .filter((item) => !!item.collection.metadata?.[CAPTURE_ERROR_KEY])
      .map((item) => ({
        order_group_id: item.group.id,
        payment_id: item.payment.id,
        error: String(item.collection.metadata?.[CAPTURE_ERROR_KEY]),
      })),
    payouts: payouts.map((row) => ({
      id: row.id,
      order_id: row.order_id,
      amount: row.amount,
      currency_code: row.currency_code,
      status_reason: row.status_reason,
    })),
    reversals: reversals.map((row) => ({
      id: row.id,
      payout_id: row.payout_id,
      refund_id: row.refund_id,
      amount: row.amount,
      status_reason: row.status_reason,
    })),
    settlements: settlements.map((row) => ({
      id: row.id,
      account_id: row.account_id,
      amount: row.amount,
      currency_code: row.currency_code,
      status_reason: row.status_reason,
    })),
    adjustments: adjustments.map((row) => ({
      id: row.id,
      account_id: row.account_id,
      amount: row.amount,
      currency_code: row.currency_code,
      status_reason: row.status_reason,
    })),
  }
}

const line = (label: string, rows: Record<string, unknown>[]) =>
  rows.length
    ? `${label} (${rows.length}):\n` +
      rows.map((row) => `  - ${Object.entries(row).map(([k, v]) => `${k}=${String(v ?? "")}`).join(" ")}`).join("\n")
    : `${label}: none`

export async function alertFailedOperations(ctx: JobContext) {
  const { container, options, stats, logger } = ctx
  const failed = await collectFailedOperations(container, options)

  stats.captures = failed.captures.length
  stats.payouts = failed.payouts.length
  stats.reversals = failed.reversals.length
  stats.settlements = failed.settlements.length
  stats.adjustments = failed.adjustments.length

  const total =
    failed.captures.length +
    failed.payouts.length +
    failed.reversals.length +
    failed.settlements.length +
    failed.adjustments.length
  if (!total) {
    stats.sent = 0
    return
  }

  const email = options.alerting.technicalEmail
  if (!email) {
    logger.warn(`${total} failed payout operation(s) and no alerting.technicalEmail configured`)
    stats.sent = 0
    return
  }

  const notificationService = container.resolve<INotificationModuleService>(Modules.NOTIFICATION)
  const text = [
    line("Payments that failed capturing or canceling", failed.captures),
    line("Payouts that failed", failed.payouts),
    line("Reversals that failed", failed.reversals),
    line("Settlement bank payouts that failed", failed.settlements),
    line("Adjustments that failed", failed.adjustments),
  ].join("\n\n")

  await notificationService.createNotifications({
    to: email,
    from: options.alerting.from,
    channel: "email",
    template: "payout-operations-failed",
    data: failed as unknown as Record<string, unknown>,
    content: {
      subject: `[Payouts] ${total} failed operation(s) need attention`,
      text,
    },
  })

  stats.sent = 1
}
