import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { IMagentoWebhookModuleService, MAGENTO_WEBHOOK_MODULE } from "../../../types"

export type DeleteMagentoWebhookDeliveriesStepInput = {
  delivered_before: Date
  limit?: number
}

export const deleteMagentoWebhookDeliveriesStepId = "delete-magento-webhook-deliveries"
export const deleteMagentoWebhookDeliveriesStep = createStep(
  deleteMagentoWebhookDeliveriesStepId,
  async (input: DeleteMagentoWebhookDeliveriesStepInput, { container }) => {
    const service = container.resolve<IMagentoWebhookModuleService>(MAGENTO_WEBHOOK_MODULE)

    const stale = await service.listMagentoWebhookDeliveries(
      { status: "delivered", delivered_at: { $lt: input.delivered_before } },
      { select: ["id"], take: input.limit ?? 1000 }
    )

    if (stale.length) {
      await service.deleteMagentoWebhookDeliveries(stale.map((d) => d.id))
    }

    return new StepResponse(stale.length)
  }
)
