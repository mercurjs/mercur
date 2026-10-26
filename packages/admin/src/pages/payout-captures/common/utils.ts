import { BigNumberInput } from "@medusajs/types"
import { TFunction } from "i18next"

import { AdminPayoutCapture } from "../../../hooks/api/payout-captures"

type BadgeColor = "green" | "red" | "blue" | "orange" | "grey" | "purple"

export const toNumber = (value: BigNumberInput | null | undefined): number => {
  if (value === null || value === undefined) {
    return 0
  }

  if (typeof value === "number") {
    return value
  }

  if (typeof value === "string") {
    return Number(value)
  }

  if (typeof value === "object" && "numeric" in value) {
    return Number(value.numeric)
  }

  return Number(value)
}

export const getPayoutCaptureActionProps = (
  action: AdminPayoutCapture["action"],
  t: TFunction,
): { color: BadgeColor; label: string } => {
  const colors: Record<AdminPayoutCapture["action"], BadgeColor> = {
    wait: "orange",
    capture: "green",
    cancel: "grey",
    expired: "red",
  }

  return {
    color: colors[action] ?? "grey",
    label: t(`payoutCaptures.action.${action}`, { defaultValue: action }),
  }
}

export const getPayoutCaptureOrderStatusProps = (
  order: { status: string; canceled_at: Date | string | null; fulfillment_status: string | null },
  t: TFunction,
): { color: BadgeColor; label: string } => {
  if (order.status === "canceled" || order.canceled_at) {
    return { color: "red", label: t("payoutCaptures.orders.status.canceled") }
  }

  if (order.fulfillment_status === "delivered") {
    return { color: "green", label: t("payoutCaptures.orders.status.delivered") }
  }

  if (order.fulfillment_status === "shipped") {
    return { color: "blue", label: t("payoutCaptures.orders.status.shipped") }
  }

  if (order.fulfillment_status === "fulfilled") {
    return { color: "blue", label: t("payoutCaptures.orders.status.fulfilled") }
  }

  return { color: "orange", label: t("payoutCaptures.orders.status.pending") }
}
