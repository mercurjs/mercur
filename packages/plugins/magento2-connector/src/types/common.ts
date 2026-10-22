import { BaseFilterable, OperatorMap } from "@medusajs/framework/types"

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
  "order.fulfillment_canceled",
  "order.shipment_created",
  "shipment.created",
  "delivery.created",
  "order.return_requested",
  "order.return_received",
  "order.refund_recorded",
  "order.refund_requested",
  "order.payment_captured",
] as const

/**
 * Medusa emits these with the fulfillment id as `data.id` and no order id.
 */
export const FULFILLMENT_SCOPED_EVENTS: readonly string[] = ["shipment.created", "delivery.created"]

export type MagentoWebhookEvent = (typeof MAGENTO_WEBHOOK_EVENTS)[number]

export const MagentoWebhookEvents = {
  DELIVERY_CREATED: "magento_webhook_delivery.created",
  REFUND_RECORDED: "order.refund_recorded",
  REFUND_REQUESTED: "order.refund_requested",
  PAYMENT_CAPTURED: "order.payment_captured",
} as const

export const EXTERNAL_REFUND_SOURCE = "external"

export type MagentoWebhookDeliveryStatus = "pending" | "delivered" | "failed" | "dead"

export type MagentoWebhookEndpointDTO = {
  id: string
  url: string
  secret: string
  events: string[]
  is_active: boolean
  description: string | null
  metadata: Record<string, unknown> | null
  deliveries?: MagentoWebhookDeliveryDTO[]
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export type MagentoWebhookDeliveryDTO = {
  id: string
  endpoint_id: string
  endpoint?: MagentoWebhookEndpointDTO
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
  deleted_at: Date | null
}

export type CreateMagentoWebhookEndpointDTO = {
  url: string
  secret: string
  events: string[]
  is_active?: boolean
  description?: string | null
  metadata?: Record<string, unknown> | null
}

export type UpdateMagentoWebhookEndpointDTO = {
  id: string
  url?: string
  secret?: string
  events?: string[]
  is_active?: boolean
  description?: string | null
  metadata?: Record<string, unknown> | null
}

export type CreateMagentoWebhookDeliveryDTO = {
  endpoint_id: string
  event: string
  payload: Record<string, unknown>
  status?: MagentoWebhookDeliveryStatus
  attempts?: number
  next_attempt_at?: Date | null
}

export type UpdateMagentoWebhookDeliveryDTO = {
  id: string
  status?: MagentoWebhookDeliveryStatus
  attempts?: number
  next_attempt_at?: Date | null
  response_status?: number | null
  response_body?: string | null
  delivered_at?: Date | null
}

export type FilterableMagentoWebhookEndpointProps =
  BaseFilterable<FilterableMagentoWebhookEndpointProps> & {
    id?: string | string[]
    is_active?: boolean
  }

export type FilterableMagentoWebhookDeliveryProps =
  BaseFilterable<FilterableMagentoWebhookDeliveryProps> & {
    id?: string | string[]
    endpoint_id?: string | string[]
    event?: string | string[]
    status?: MagentoWebhookDeliveryStatus | MagentoWebhookDeliveryStatus[]
    next_attempt_at?: OperatorMap<Date>
    delivered_at?: OperatorMap<Date>
    created_at?: OperatorMap<Date>
  }

export type ExternalPaymentSessionData = {
  reference?: string
  authorized_at?: string
  captured_at?: string
  canceled_at?: string
  payment_method?: string
  channel?: string
  amount?: number
  currency_code?: string
  refunds?: { reference?: string; amount: number }[]
}
