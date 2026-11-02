import { TFunction } from "i18next"

type BadgeColor = "green" | "red" | "blue" | "orange" | "grey"

export const PAYOUT_STATUSES = [
  "pending",
  "on_hold",
  "processing",
  "paid",
  "failed",
  "aborted",
] as const

const STATUS_COLORS: Record<string, BadgeColor> = {
  pending: "grey",
  on_hold: "orange",
  processing: "blue",
  paid: "green",
  failed: "red",
  aborted: "red",
}

export const payoutStatusColor = (status: string): BadgeColor =>
  STATUS_COLORS[status] ?? "grey"

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
