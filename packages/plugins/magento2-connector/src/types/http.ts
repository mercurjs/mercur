import {
  DeleteResponse,
  FindParams,
  OperatorMap,
  PaginatedResponse,
  SelectParams,
} from "@medusajs/framework/types"

import { MagentoWebhookDeliveryStatus, MagentoWebhookEvent } from "./common"

export interface AdminMagentoWebhook {
  id: string
  url: string
  events: string[]
  is_active: boolean
  description: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface AdminMagentoWebhookWithSecret extends AdminMagentoWebhook {
  secret: string
}

export interface AdminMagentoWebhookDelivery {
  id: string
  endpoint_id: string
  event: string
  payload: Record<string, unknown>
  status: MagentoWebhookDeliveryStatus
  attempts: number
  next_attempt_at: string | null
  response_status: number | null
  response_body: string | null
  delivered_at: string | null
  created_at: string
  updated_at: string
}

export interface AdminMagentoWebhookListParams extends FindParams {
  id?: string | string[]
  is_active?: boolean
}

export interface AdminMagentoWebhookParams extends SelectParams {}

export interface AdminMagentoWebhookDeliveryListParams extends FindParams {
  status?: MagentoWebhookDeliveryStatus | MagentoWebhookDeliveryStatus[]
  event?: string | string[]
  created_at?: OperatorMap<string>
}

export interface AdminCreateMagentoWebhook {
  url: string
  secret?: string
  events: MagentoWebhookEvent[]
  is_active?: boolean
  description?: string | null
  metadata?: Record<string, unknown> | null
}

export interface AdminUpdateMagentoWebhook {
  url?: string
  secret?: string
  events?: MagentoWebhookEvent[]
  is_active?: boolean
  description?: string | null
  metadata?: Record<string, unknown> | null
}

export interface AdminRecordExternalRefund {
  amount: number
  reference?: string
  note?: string
}

export interface AdminCaptureExternalPayment {
  reference?: string
}

export interface AdminCancelExternalPayment {
  reference?: string
}

export interface AdminMagentoWebhookResponse {
  webhook: AdminMagentoWebhook
}

export interface AdminMagentoWebhookCreateResponse {
  webhook: AdminMagentoWebhookWithSecret
}

export interface AdminMagentoWebhookListResponse
  extends PaginatedResponse<{ webhooks: AdminMagentoWebhook[] }> {}

export interface AdminMagentoWebhookDeleteResponse extends DeleteResponse<"magento_webhook"> {}

export interface AdminMagentoWebhookDeliveryResponse {
  delivery: AdminMagentoWebhookDelivery
}

export interface AdminMagentoWebhookDeliveryListResponse
  extends PaginatedResponse<{ deliveries: AdminMagentoWebhookDelivery[] }> {}

export interface AdminMagentoStatusResponse {
  payment_provider: { id: string; installed: boolean }
  events: readonly string[]
  webhooks: { total: number; active: number }
  deliveries: {
    window_hours: number
    delivered: number
    failed: number
    dead: number
    pending: number
    last_delivered_at: string | Date | null
  }
  orders: { channel: string; last_24h: number }
}

export interface AdminExternalPayment {
  id: string
  amount: number
  currency_code: string
  provider_id: string
  captured_at: string | null
  canceled_at: string | null
  refunds: { id: string; amount: number; note: string | null; created_at: string }[]
}

export interface AdminExternalRefundResponse {
  payment: AdminExternalPayment
}

export interface AdminExternalPaymentResponse {
  payment: AdminExternalPayment
}
