import { MedusaContainer } from "@medusajs/framework/types"

import MagentoWebhookModuleService from "../modules/magento-webhook/service"
import { MAGENTO_WEBHOOK_MODULE } from "../types"

const RETENTION_DAYS = 30

export default async function pruneMagentoWebhookDeliveries(
  container: MedusaContainer
) {
  const service = container.resolve<MagentoWebhookModuleService>(
    MAGENTO_WEBHOOK_MODULE
  )

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60_000)
  const stale = await service.listMagentoWebhookDeliveries(
    { status: "delivered", delivered_at: { $lt: cutoff } },
    { select: ["id"], take: 1000 }
  )

  if (stale.length) {
    await service.deleteMagentoWebhookDeliveries(stale.map((d) => d.id))
  }
}

export const config = {
  name: "prune-magento-webhook-deliveries",
  schedule: "0 3 * * *",
}
