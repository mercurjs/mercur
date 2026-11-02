import { BigNumberInput } from "@medusajs/framework/types"

export type FailedOperations = {
  captures: { order_group_id: string; payment_id: string; error: string | null }[]
  payouts: { id: string; order_id: string | null; amount: BigNumberInput; currency_code: string; status_reason: string | null }[]
  reversals: { id: string; payout_id: string; refund_id: string | null; amount: BigNumberInput; status_reason: string | null }[]
  settlements: { id: string; account_id: string; amount: BigNumberInput; currency_code: string; status_reason: string | null }[]
  adjustments: { id: string; account_id: string; amount: BigNumberInput; currency_code: string; status_reason: string | null }[]
}

export type Alerting = { email: string | null; from: string | null }

const section = (label: string, rows: Record<string, unknown>[]) =>
  rows.length
    ? `${label} (${rows.length}):\n` +
      rows.map((row) => `  - ${Object.entries(row).map(([k, v]) => `${k}=${String(v ?? "")}`).join(" ")}`).join("\n")
    : `${label}: none`

export const countFailedOperations = (failed: FailedOperations) =>
  Object.values(failed).reduce((sum, rows) => sum + rows.length, 0)

export function failedOperationsNotifications(failed: FailedOperations, alerting: Alerting) {
  const total = countFailedOperations(failed)
  if (!total || !alerting.email) {
    return []
  }
  return [
    {
      to: alerting.email,
      from: alerting.from,
      channel: "email",
      template: "payout-operations-failed",
      data: { ...failed },
      content: {
        subject: `[Payouts] ${total} failed operation(s) need attention`,
        text: [
          section("Payments that failed capturing or canceling", failed.captures),
          section("Payouts that failed", failed.payouts),
          section("Reversals that failed", failed.reversals),
          section("Settlement bank payouts that failed", failed.settlements),
          section("Adjustments that failed", failed.adjustments),
        ].join("\n\n"),
      },
    },
  ]
}
