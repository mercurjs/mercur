export const MAGENTO_WEBHOOK_MODULE = "magento_webhook"

export const EXTERNAL_PAYMENT_PROVIDER_ID = "pp_external_external"

export const MAGENTO_WEBHOOK_EVENTS = [
  "offer.created",
  "offer.updated",
  "offer.deleted",
  "seller.updated",
  "seller.approved",
  "seller.suspended",
  "seller.unsuspended",
  "seller.terminated",
  "seller.unterminated",
  "product.published",
  "product.rejected",
  "order_group.created",
  "order.updated",
  "order.canceled",
  "order.fulfillment_created",
  "order.shipment_created",
  "order.refund_recorded",
] as const

export type MagentoWebhookEvent = (typeof MAGENTO_WEBHOOK_EVENTS)[number]

export const MagentoWebhookEvents = {
  DELIVERY_CREATED: "magento_webhook_delivery.created",
  REFUND_RECORDED: "order.refund_recorded",
} as const

export type MagentoWebhookDeliveryStatus = "pending" | "delivered" | "failed" | "dead"

export type MagentoWebhookEndpointDTO = {
  id: string
  url: string
  secret: string
  events: string[]
  is_active: boolean
  description: string | null
  metadata: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

export type MagentoWebhookDeliveryDTO = {
  id: string
  endpoint_id: string
  event: string
  payload: Record<string, unknown>
  status: MagentoWebhookDeliveryStatus
  attempts: number
  next_attempt_at: Date | null
  response_status: number | null
  response_body: string | null
  delivered_at: Date | null
  created_at: Date
  updated_at: Date
}

export type ExternalPaymentSessionData = {
  reference?: string
  captured_at?: string
  channel?: string
  amount?: number
  currency_code?: string
  refunds?: { reference?: string; amount: number }[]
}
