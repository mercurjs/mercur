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
