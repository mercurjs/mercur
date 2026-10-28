import { TFunction } from "i18next"

type BadgeColor = "green" | "red" | "blue" | "orange" | "grey" | "purple"

export const PAYOUT_STATUSES = [
  "pending",
  "on_hold",
  "processing",
  "paid",
  "failed",
  "aborted",
] as const

export const RETRYABLE_PAYOUT_STATUSES = ["failed", "on_hold", "pending"]

const STATUS_COLORS: Record<string, BadgeColor> = {
  pending: "grey",
  on_hold: "orange",
  processing: "blue",
  paid: "green",
  failed: "red",
  aborted: "red",
}

export const getPayoutStatusProps = (
  status: string,
  t: TFunction,
): { color: BadgeColor; label: string } => ({
  color: STATUS_COLORS[status] ?? "grey",
  label: t(`payouts.status.${status}`, { defaultValue: status }),
})

export const PAYOUT_STATUS_REASONS = [
  "account_not_ready",
  "account_payouts_disabled",
  "order_not_ready",
  "order_aborted",
  "payment_not_ready",
  "payment_failed",
  "payment_canceled",
  "payment_refunded",
  "payout_not_ready",
  "refund_aborted",
  "refund_absorbed",
  "invalid_amount",
  "provider_error",
] as const

type PayoutStatusReason = (typeof PAYOUT_STATUS_REASONS)[number]

const isPayoutStatusReason = (reason: string): reason is PayoutStatusReason =>
  (PAYOUT_STATUS_REASONS as readonly string[]).includes(reason)

export const getPayoutStatusReasonLabel = (reason: string, t: TFunction) =>
  isPayoutStatusReason(reason)
    ? t(`payouts.statusReasons.${reason}`)
    : t("payouts.statusReasons.other")

export const getPayoutStatusDetail = (
  data: Record<string, unknown> | null | undefined
) => {
  const detail = data?.status_detail
  return typeof detail === "string" && detail.length > 0 ? detail : null
}
