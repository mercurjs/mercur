import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { IPaymentModuleService } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import {
  AdminMagentoStatusResponse,
  EXTERNAL_PAYMENT_PROVIDER_ID,
  IMagentoWebhookModuleService,
  MAGENTO_WEBHOOK_EVENTS,
  MAGENTO_WEBHOOK_MODULE,
} from "../../../../types"

const WINDOW_HOURS = 24

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminMagentoStatusResponse>
) => {
  const webhooks = req.scope.resolve<IMagentoWebhookModuleService>(MAGENTO_WEBHOOK_MODULE)
  const payment = req.scope.resolve<IPaymentModuleService>(Modules.PAYMENT)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60_000)

  const [providers, endpoints, recent, lastDelivered, orders] = await Promise.all([
    payment.listPaymentProviders({ id: EXTERNAL_PAYMENT_PROVIDER_ID }),
    webhooks.listMagentoWebhookEndpoints({}, { select: ["id", "is_active"] }),
    webhooks.listMagentoWebhookDeliveries(
      { created_at: { $gte: since } },
      { select: ["id", "status"] }
    ),
    webhooks.listMagentoWebhookDeliveries(
      { status: "delivered" },
      { select: ["id", "delivered_at"], order: { delivered_at: "DESC" }, take: 1 }
    ),
    query.graph({
      entity: "order_group",
      fields: ["id"],
      filters: { created_at: { $gte: since }, metadata: { channel: "magento" } },
    }),
  ])

  const counts = { delivered: 0, failed: 0, dead: 0, pending: 0 }
  for (const delivery of recent) {
    counts[delivery.status] += 1
  }

  res.json({
    payment_provider: {
      id: EXTERNAL_PAYMENT_PROVIDER_ID,
      installed: providers.length > 0,
    },
    events: MAGENTO_WEBHOOK_EVENTS,
    webhooks: {
      total: endpoints.length,
      active: endpoints.filter((e) => e.is_active).length,
    },
    deliveries: {
      window_hours: WINDOW_HOURS,
      ...counts,
      last_delivered_at: lastDelivered[0]?.delivered_at ?? null,
    },
    orders: { channel: "magento", last_24h: orders.data.length },
  })
}
