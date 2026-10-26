import { TFunction } from "i18next"

type BadgeColor = "green" | "red" | "blue" | "orange" | "grey" | "purple"

export const SETTLEMENT_STATUSES = ["open", "paid_out", "failed", "aborted"] as const

export const getSettlementStatusProps = (
  status: string,
  t: TFunction,
): { color: BadgeColor; label: string } => {
  const colors: Record<string, BadgeColor> = {
    open: "orange",
    paid_out: "green",
    failed: "red",
    aborted: "red",
  }

  return {
    color: colors[status] ?? "grey",
    label: t(`settlements.status.${status}`, { defaultValue: status }),
  }
}

export const getSettlementPayoutStatusProps = (
  status: string,
  t: TFunction,
): { color: BadgeColor; label: string } => {
  const colors: Record<string, BadgeColor> = {
    pending: "grey",
    processing: "orange",
    paid: "green",
    failed: "red",
    canceled: "red",
    on_hold: "orange",
    aborted: "red",
  }

  return {
    color: colors[status] ?? "grey",
    label: t(`payouts.status.${status}`, { defaultValue: status }),
  }
}
