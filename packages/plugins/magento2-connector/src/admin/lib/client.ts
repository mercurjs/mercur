import { createClient, type InferClient } from "@mercurjs/client"
import type { MedusaResponse } from "@medusajs/framework"

import { getAuthHeaders } from "./auth-headers"

export type MagentoWebhookDeliveryStatus = "pending" | "delivered" | "failed" | "dead"

export type MagentoWebhook = {
  id: string
  url: string
  events: string[]
  is_active: boolean
  description: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type MagentoWebhookDelivery = {
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

export type MagentoStatus = {
  payment_provider: { id: string; installed: boolean }
  events: string[]
  webhooks: { total: number; active: number }
  deliveries: {
    window_hours: number
    delivered: number
    failed: number
    dead: number
    pending: number
    last_delivered_at: string | null
  }
  orders: { channel: string; last_24h: number }
}

type ListQuery = { limit?: number; offset?: number }

type Route<Input, Output> = (
  req: { validatedBody: Input },
  res: MedusaResponse<Output>
) => Promise<void>

type Empty = { fields?: string }

type Routes = {
  admin: {
    magento: {
      status: { GET: Route<Empty, MagentoStatus> }
      webhooks: {
        GET: Route<
          ListQuery & { is_active?: boolean },
          { webhooks: MagentoWebhook[]; count: number; offset: number; limit: number }
        >
        POST: Route<
          { url: string; events: string[]; description?: string | null; secret?: string },
          { webhook: MagentoWebhook & { secret: string } }
        >
        $id: {
          GET: Route<Empty, { webhook: MagentoWebhook }>
          POST: Route<
            { url?: string; events?: string[]; is_active?: boolean; description?: string | null },
            { webhook: MagentoWebhook }
          >
          DELETE: Route<Empty, { id: string; object: string; deleted: boolean }>
          deliveries: {
            GET: Route<
              ListQuery & { status?: MagentoWebhookDeliveryStatus | MagentoWebhookDeliveryStatus[] },
              { deliveries: MagentoWebhookDelivery[]; count: number; offset: number; limit: number }
            >
            $delivery_id: {
              redeliver: {
                POST: Route<Empty, { delivery: MagentoWebhookDelivery }>
              }
            }
          }
        }
      }
    }
  }
}

export const client: InferClient<Routes> = createClient({
  baseUrl: import.meta.env.VITE_MERCUR_BACKEND_URL || "http://localhost:9000",
  fetchOptions: { credentials: "omit" },
  headers: getAuthHeaders,
})
