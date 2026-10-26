import { TFunction } from "i18next"

type BadgeColor = "green" | "red" | "blue" | "orange" | "grey" | "purple"

export const TRANSFER_STATUSES = [
  "pending",
  "created",
  "failed",
  "on_hold",
  "aborted",
  "ignored",
] as const

export const TRANSFER_TYPES = [
  "order",
  "tax",
  "refund_reversal",
  "adjustment_credit",
  "adjustment_debit",
] as const

export const RETRYABLE_TRANSFER_STATUSES = ["failed", "on_hold", "pending"]

export const getTransferStatusProps = (
  status: string,
  t: TFunction,
): { color: BadgeColor; label: string } => {
  const colors: Record<string, BadgeColor> = {
    pending: "grey",
    created: "green",
    failed: "red",
    on_hold: "orange",
    aborted: "red",
    ignored: "grey",
  }

  return {
    color: colors[status] ?? "grey",
    label: t(`transfers.status.${status}`, { defaultValue: status }),
  }
}

export const getTransferTypeLabel = (type: string, t: TFunction) =>
  t(`transfers.type.${type}`, { defaultValue: type })
