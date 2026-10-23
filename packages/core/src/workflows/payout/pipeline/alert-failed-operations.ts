import { INotificationModuleService, MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { MercurModules, PayoutStatus, TransferStatus, TransferType } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"
import { PayoutJobContext } from "../utils/run-payout-job"
import { listPendingCaptures } from "./evaluate-captures"

export type FailedOperations = {
  captures: { order_group_id: string; payment_id: string; error: string }[]
  transfers: { id: string; order_id: string | null; amount: unknown; currency_code: string; status_reason: string | null }[]
  reversals: { id: string; order_id: string | null; refund_id: string | null; amount: unknown; currency_code: string; status_reason: string | null }[]
  payouts: { id: string; account_id: string; amount: unknown; currency_code: string; status_reason: string | null }[]
}

/** AlertingCommand's four queries. */
export async function collectFailedOperations(container: MedusaContainer): Promise<FailedOperations> {
  const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)

  const pending = await listPendingCaptures(container)
  const captures = pending
    .filter((item) => !!item.collection.metadata?.payout_capture_error)
    .map((item) => ({
      order_group_id: item.group.id,
      payment_id: item.payment.id,
      error: String(item.collection.metadata?.payout_capture_error),
    }))

  const failedTransfers = await service.listTransfers({ status: TransferStatus.FAILED }, { take: null })
  const failedPayouts = await service.listPayouts({ status: PayoutStatus.FAILED }, { take: null })

  return {
    captures,
    transfers: failedTransfers
      .filter((row) => row.type !== TransferType.REFUND_REVERSAL)
      .map((row) => ({
        id: row.id,
        order_id: row.order_id,
        amount: row.amount,
        currency_code: row.currency_code,
        status_reason: row.status_reason,
      })),
    reversals: failedTransfers
      .filter((row) => row.type === TransferType.REFUND_REVERSAL)
      .map((row) => ({
        id: row.id,
        order_id: row.order_id,
        refund_id: row.refund_id,
        amount: row.amount,
        currency_code: row.currency_code,
        status_reason: row.status_reason,
      })),
    payouts: failedPayouts.map((row) => ({
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

export async function alertFailedOperations(ctx: PayoutJobContext) {
  const { container, service, stats, logger } = ctx
  const options = service.getOptions()
  const failed = await collectFailedOperations(container)

  stats.captures = failed.captures.length
  stats.transfers = failed.transfers.length
  stats.reversals = failed.reversals.length
  stats.payouts = failed.payouts.length

  const total = failed.captures.length + failed.transfers.length + failed.reversals.length + failed.payouts.length
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
    line("Transfers that failed", failed.transfers),
    line("Reversals that failed", failed.reversals),
    line("Payouts that failed", failed.payouts),
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
