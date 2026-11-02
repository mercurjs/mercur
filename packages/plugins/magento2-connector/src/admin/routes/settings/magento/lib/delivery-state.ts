import type { MagentoWebhookDeliveryStatus } from "../../../../lib/client"

export const DELIVERY_STATE_COLOR: Record<
  MagentoWebhookDeliveryStatus,
  "green" | "red" | "orange" | "grey"
> = {
  pending: "orange",
  delivered: "green",
  failed: "orange",
  dead: "red",
}

export const DELIVERY_STATE_LABEL: Record<MagentoWebhookDeliveryStatus, string> = {
  pending: "Queued",
  delivered: "Delivered",
  failed: "Retrying",
  dead: "Gave up",
}

export const LIVE_DELIVERY_STATES: MagentoWebhookDeliveryStatus[] = ["pending", "failed"]
