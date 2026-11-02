import { MedusaContainer } from "@medusajs/framework/types"

import { pruneMagentoWebhookDeliveriesWorkflow } from "../workflows"

const RETENTION_DAYS = 30

export default async function pruneMagentoWebhookDeliveries(container: MedusaContainer) {
  await pruneMagentoWebhookDeliveriesWorkflow(container).run({
    input: { delivered_before: new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60_000) },
  })
}

export const config = {
  name: "prune-magento-webhook-deliveries",
  schedule: "0 3 * * *",
}
