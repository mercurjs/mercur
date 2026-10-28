import { getStylizedAmount } from "@mercurjs/dashboard-shared"
import cronstrue from "cronstrue"

export type BadgeColor = "green" | "red" | "orange" | "grey" | "blue" | "purple"

export const PAYOUT_STATUS_COLOR: Record<string, BadgeColor> = {
  pending: "blue",
  processing: "blue",
  paid: "green",
  failed: "red",
  on_hold: "orange",
  aborted: "grey",
}

export const PAYOUT_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  refunds: "Refunds",
  paid: "Paid",
  failed: "Failed",
  on_hold: "On hold",
  aborted: "Aborted",
}

const PAYOUT_STATUS_REASON_LABEL: Record<string, string> = {
  account_not_ready: "The store's payout account cannot receive payouts yet.",
  account_payouts_disabled: "Payouts are disabled on the store's payout account.",
  order_not_ready: "The order is not fulfilled yet.",
  order_aborted: "The order was canceled.",
  payment_not_ready: "The order's payment is not captured yet.",
  payment_failed: "The order's payment failed.",
  payment_canceled: "The order's payment was canceled.",
  payment_refunded: "The order's payment was refunded in full.",
  payout_not_ready: "The payout for this order has not been sent yet.",
  refund_aborted: "The refund was canceled.",
  refund_absorbed: "The refund was deducted before the payout was sent.",
  invalid_amount: "The amount to pay out is not valid.",
  provider_error: "Stripe returned an error.",
}

export const payoutStatusReasonLabel = (reason: string) =>
  PAYOUT_STATUS_REASON_LABEL[reason] ?? "This payout needs attention."

export const payoutStatusDetail = (data: Record<string, unknown> | null | undefined) => {
  const detail = data?.status_detail
  return typeof detail === "string" && detail.length > 0 ? detail : null
}

export const SETTLEMENT_STATUS_COLOR: Record<string, BadgeColor> = {
  open: "blue",
  paid_out: "green",
  failed: "red",
  aborted: "grey",
}

export const SETTLEMENT_STATUS_LABEL: Record<string, string> = {
  open: "Open",
  paid_out: "Paid out",
  failed: "Failed",
  aborted: "Aborted",
}

export const JOB_LABEL: Record<string, string> = {
  "payout-sync-onboarding": "Onboarding",
  "payout-validate-captures": "Captures",
  "payout-process-transfers": "Payouts",
  "payout-process-reversals": "Reversals",
  "payout-process-settlements": "Settlements",
  "payout-alert-failed-operations": "Alerts",
  "payout-monitor-kyc": "KYC",
}

export const JOB_DESCRIPTION: Record<string, string> = {
  "payout-sync-onboarding": "Creates Stripe Express accounts for new sellers and publishes their onboarding links.",
  "payout-validate-captures": "Captures or cancels the authorized card payment once every seller order in the group is decided.",
  "payout-process-transfers": "Pays each fulfilled order's total minus commission into the seller's connected account.",
  "payout-process-reversals": "Reverses the seller's share of every refund, net of commission.",
  "payout-process-settlements": "Sends adjustments, retries failed bank payouts, builds settlements and pays them out.",
  "payout-alert-failed-operations": "Emails the technical contact everything that is still failed.",
  "payout-monitor-kyc": "Re-reads every connected account's requirements and KYC status.",
}

type StripeRequirements = {
  currently_due: string[]
  past_due: string[]
  pending_verification: string[]
}

/** The connected account Stripe returned, kept on the payout account as `data`. */
export const stripeRequirementsOf = (data: Record<string, unknown> | null | undefined): StripeRequirements => {
  const requirements = data?.requirements as Partial<StripeRequirements> | undefined
  return {
    currently_due: requirements?.currently_due ?? [],
    past_due: requirements?.past_due ?? [],
    pending_verification: requirements?.pending_verification ?? [],
  }
}

export const JOB_RUN_STATUS_COLOR: Record<string, BadgeColor> = {
  running: "blue",
  succeeded: "green",
  failed: "red",
}

export const JOB_RUN_STATUS_LABEL: Record<string, string> = {
  running: "Running",
  succeeded: "Succeeded",
  failed: "Failed",
}

export const JOB_TRIGGER_LABEL: Record<string, string> = {
  schedule: "Schedule",
  manual: "Manual",
  subscriber: "Event",
}

const JOB_STAT_LABEL: Record<string, string> = {
  accounts: "Accounts",
  adjustments: "Adjustments",
  adjustments_processed: "Adjustments sent",
  attention: "Need attention",
  aborted: "Aborted",
  awaiting_account: "Awaiting account",
  backlog: "Backlog",
  blocked: "Blocked",
  canceled: "Canceled",
  captured: "Captured",
  captures: "Captures",
  expired: "Expired",
  failed: "Failed",
  ignored: "Ignored",
  new_orders: "New orders",
  on_hold: "On hold",
  orders: "Orders",
  paid: "Paid",
  payouts: "Payouts",
  payouts_retried: "Bank payouts retried",
  pending: "Pending",
  processed: "Processed",
  processing: "Processing",
  refunds: "Refunds",
  reversals: "Reversals",
  sellers: "Stores",
  sent: "Emails sent",
  settlements: "Settlements",
  skipped: "Skipped",
  synced: "Synced",
  total: "Total",
}

const humanizeKey = (key: string) => {
  const text = key.replace(/_/g, " ")
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export const formatJobStats = (stats: Record<string, unknown> | null | undefined) =>
  stats && Object.keys(stats).length
    ? Object.entries(stats)
        .map(([key, value]) => `${JOB_STAT_LABEL[key] ?? humanizeKey(key)}: ${String(value)}`)
        .join(", ")
    : "-"

export const ADJUSTMENT_TYPE_LABEL: Record<string, string> = {
  subscription: "Subscription",
  extra_invoice: "Extra invoice",
  extra_credit: "Extra credit",
}

export const RETRYABLE_STATUSES = ["failed", "on_hold", "pending"]

export const statusProps = (
  status: string | null | undefined,
  colors: Record<string, BadgeColor>,
  labels: Record<string, string>
): { color: BadgeColor; label: string } => ({
  color: (status && colors[status]) || "grey",
  label: (status && labels[status]) || status || "-",
})

export const toNumber = (amount: unknown) => Number(amount ?? 0)

/** The bank payout: what landed on the connected balance, else the net amount. */
export const formatSettlementPayout = (settlement: {
  amount: unknown
  currency_code: string
  payout_amount?: unknown
  payout_currency_code?: string | null
}) =>
  getStylizedAmount(
    toNumber(settlement.payout_amount ?? settlement.amount),
    settlement.payout_currency_code ?? settlement.currency_code
  )

// Stripe's `requirements.disabled_reason` values:
// https://docs.stripe.com/api/accounts/object#account_object-requirements-disabled_reason
const DISABLED_REASON_LABEL: Record<string, string> = {
  "action_required.requested_capabilities": "Capabilities need to be requested",
  listed: "Under review: account appears on a restricted list",
  other: "Disabled by Stripe",
  platform_paused: "Paused by the platform",
  "rejected.fraud": "Rejected for suspected fraud",
  "rejected.incomplete_verification": "Rejected: verification was not completed in time",
  "rejected.listed": "Rejected: account appears on a prohibited list",
  "rejected.other": "Rejected by Stripe",
  "rejected.platform_fraud": "Rejected by the platform for suspected fraud",
  "rejected.platform_other": "Rejected by the platform",
  "rejected.platform_terms_of_service": "Rejected by the platform for a terms of service violation",
  "rejected.terms_of_service": "Rejected for a terms of service violation",
  "requirements.past_due": "Required information is overdue",
  "requirements.pending_verification": "Stripe is verifying the submitted information",
  under_review: "Under review by Stripe",
}

export const disabledReasonLabel = (reason: string) =>
  DISABLED_REASON_LABEL[reason] ?? humanizeRequirement(reason)

// Requirement entries are field paths such as `individual.verification.document`.
export const humanizeRequirement = (requirement: string) => {
  const text = requirement.split(".").join(" › ").replace(/_/g, " ")
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Jobs stagger their minute (`1-59/5`) so they don't all fire at once; the
// offset means nothing to an operator, so describe them as plain intervals.
export const describeSchedule = (cron: string) => {
  const [minute, ...rest] = cron.trim().split(/\s+/)
  const normalized = [minute.replace(/^\d+-59\/(\d+)$/, "*/$1"), ...rest].join(" ")

  try {
    return cronstrue.toString(normalized, { use24HourTimeFormat: true })
  } catch {
    return cron
  }
}
