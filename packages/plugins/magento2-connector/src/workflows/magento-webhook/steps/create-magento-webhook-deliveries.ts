import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { IMagentoWebhookModuleService, MAGENTO_WEBHOOK_MODULE } from "../../../types"

export type CreateMagentoWebhookDeliveriesStepInput = {
  event: string
  payload: Record<string, unknown>
}

export const createMagentoWebhookDeliveriesStepId = "create-magento-webhook-deliveries"
export const createMagentoWebhookDeliveriesStep = createStep(
  createMagentoWebhookDeliveriesStepId,
  async (input: CreateMagentoWebhookDeliveriesStepInput, { container }) => {
    const service = container.resolve<IMagentoWebhookModuleService>(MAGENTO_WEBHOOK_MODULE)

    const endpoints = await service.listMagentoWebhookEndpoints({ is_active: true })
    const subscribed = endpoints.filter((endpoint) => endpoint.events.includes(input.event))

    if (!subscribed.length) {
      return new StepResponse([], [])
    }

    const deliveries = await service.createMagentoWebhookDeliveries(
      subscribed.map((endpoint) => ({
        endpoint_id: endpoint.id,
        event: input.event,
        payload: input.payload,
        status: "pending" as const,
        attempts: 0,
        next_attempt_at: new Date(),
      }))
    )

    return new StepResponse(
      deliveries,
      deliveries.map((d) => d.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return
    }

    const service = container.resolve<IMagentoWebhookModuleService>(MAGENTO_WEBHOOK_MODULE)
    await service.deleteMagentoWebhookDeliveries(ids)
  }
)
