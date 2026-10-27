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
  paid: "Paid",
  failed: "Failed",
  on_hold: "On hold",
  aborted: "Aborted",
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

export const ACCOUNT_STATUS_COLOR: Record<string, BadgeColor> = {
  pending: "orange",
  active: "green",
  restricted: "red",
  rejected: "red",
}

export const KYC_STATUS_COLOR: Record<string, BadgeColor> = {
  pending_submission: "orange",
  pending_approval: "blue",
  approved: "green",
  refused: "red",
}

export const KYC_STATUS_LABEL: Record<string, string> = {
  pending_submission: "Pending submission",
  pending_approval: "Pending approval",
  approved: "Approved",
  refused: "Refused",
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

export const formatDate = (value: string | Date | null | undefined) =>
  value ? new Date(value).toLocaleString() : "Never"

export const formatAmount = (amount: unknown, currency: string) => {
  const numeric = Number(amount ?? 0)
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).format(numeric)
  } catch {
    return `${numeric.toFixed(2)} ${currency.toUpperCase()}`
  }
}

export const providerIdOf = (data: Record<string, unknown> | null | undefined): string | null => {
  const provider = data?.provider as { id?: unknown } | undefined
  return typeof provider?.id === "string" ? provider.id : null
}

export type StripeRequirements = {
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
