import { MedusaContainer } from "@medusajs/framework/types"

import MagentoWebhookModuleService from "../modules/magento-webhook/service"
import { MAGENTO_WEBHOOK_MODULE } from "../types"
import { deliverMagentoWebhookWorkflow } from "../workflows"

export default async function retryMagentoWebhookDeliveries(
  container: MedusaContainer
) {
  const service = container.resolve<MagentoWebhookModuleService>(
    MAGENTO_WEBHOOK_MODULE
  )

  const ids = await service.listDueDeliveryIds()

  for (const id of ids) {
    await deliverMagentoWebhookWorkflow(container).run({
      input: { delivery_id: id },
    })
  }
}

export const config = {
  name: "retry-magento-webhook-deliveries",
  schedule: "* * * * *",
}
