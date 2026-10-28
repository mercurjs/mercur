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
import { PayoutStatus } from "@mercurjs/types"

import { CaptureStatus } from "../../types/common"
import { resolveConnector, resolvePayoutModule } from "../../utils/payout-module"
import { JobStats } from "../../utils/run-job"

export type FailedOperations = {
  captures: { order_group_id: string; payment_id: string; error: string | null }[]
  payouts: { id: string; order_id: string | null; amount: unknown; currency_code: string; status_reason: string | null }[]
  reversals: { id: string; payout_id: string; refund_id: string | null; amount: unknown; status_reason: string | null }[]
  settlements: { id: string; account_id: string; amount: unknown; currency_code: string; status_reason: string | null }[]
  adjustments: { id: string; account_id: string; amount: unknown; currency_code: string; status_reason: string | null }[]
}

const collectFailedOperationsStep = createStep("collect-stripe-failed-operations", async (_, { container }) => {
  const payoutModule = resolvePayoutModule(container)
  const connector = resolveConnector(container)

  const [captures, payouts, reversals, settlements, adjustments] = await Promise.all([
    connector.listStripeCaptures({ status: CaptureStatus.FAILED }, { take: null }),
    payoutModule.listPayouts({ status: PayoutStatus.FAILED }, { take: null }),
    payoutModule.listPayoutReversals({ status: PayoutStatus.FAILED }, { take: null }),
    connector.listSettlements({ payout_status: PayoutStatus.FAILED }, { take: null }),
    connector.listAdjustments({ status: PayoutStatus.FAILED }, { take: null }),
  ])

  const failed: FailedOperations = {
    captures: captures.map((row) => ({
      order_group_id: row.order_group_id,
      payment_id: row.payment_id,
      error: row.status_reason,
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

  const { alerting } = connector.getOptions()
  const total = Object.values(failed).reduce((sum, rows) => sum + rows.length, 0)
  if (total && !alerting.technicalEmail) {
    container
      .resolve(ContainerRegistrationKeys.LOGGER)
      .warn(`${total} failed payout operation(s) and no alerting.technicalEmail configured`)
  }

  return new StepResponse({
    failed,
    total,
    email: alerting.technicalEmail ?? null,
    from: alerting.from ?? null,
  })
})

const section = (label: string, rows: Record<string, unknown>[]) =>
  rows.length
    ? `${label} (${rows.length}):\n` +
      rows.map((row) => `  - ${Object.entries(row).map(([k, v]) => `${k}=${String(v ?? "")}`).join(" ")}`).join("\n")
    : `${label}: none`

export const alertFailedOperationsWorkflowId = "alert-stripe-failed-operations"

/** Mails the operator the daily digest of captures, payouts, reversals, settlements and adjustments that failed. */
export const alertFailedOperationsWorkflow = createWorkflow(alertFailedOperationsWorkflowId, function () {
  const collected = collectFailedOperationsStep()

  const notifications = transform({ collected }, ({ collected }) =>
    collected.total && collected.email
      ? [
          {
            to: collected.email,
            from: collected.from,
            channel: "email",
            template: "payout-operations-failed",
            data: collected.failed as unknown as Record<string, unknown>,
            content: {
              subject: `[Payouts] ${collected.total} failed operation(s) need attention`,
              text: [
                section("Payments that failed capturing or canceling", collected.failed.captures),
                section("Payouts that failed", collected.failed.payouts),
                section("Reversals that failed", collected.failed.reversals),
                section("Settlement bank payouts that failed", collected.failed.settlements),
                section("Adjustments that failed", collected.failed.adjustments),
              ].join("\n\n"),
            },
          },
        ]
      : []
  )

  when({ notifications }, ({ notifications }) => notifications.length > 0).then(() => {
    sendNotificationsStep(notifications)
  })

  const stats = transform({ collected, notifications }, ({ collected, notifications }): JobStats => ({
    captures: collected.failed.captures.length,
    payouts: collected.failed.payouts.length,
    reversals: collected.failed.reversals.length,
    settlements: collected.failed.settlements.length,
    adjustments: collected.failed.adjustments.length,
    sent: notifications.length,
  }))

  return new WorkflowResponse(stats)
})
