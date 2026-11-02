import { MedusaContainer } from "@medusajs/framework/types"

import { IMagentoWebhookModuleService, MAGENTO_WEBHOOK_MODULE } from "../types"
import { deliverMagentoWebhookWorkflow } from "../workflows"

export default async function retryMagentoWebhookDeliveries(container: MedusaContainer) {
  const service = container.resolve<IMagentoWebhookModuleService>(MAGENTO_WEBHOOK_MODULE)

  const due = await service.listMagentoWebhookDeliveries(
    { status: ["pending", "failed"], next_attempt_at: { $lte: new Date() } },
    { select: ["id"], take: 200 }
  )

  for (const delivery of due) {
    await deliverMagentoWebhookWorkflow(container).run({
      input: { delivery_id: delivery.id },
    })
  }
}

export const config = {
  name: "retry-magento-webhook-deliveries",
  schedule: "* * * * *",
}
