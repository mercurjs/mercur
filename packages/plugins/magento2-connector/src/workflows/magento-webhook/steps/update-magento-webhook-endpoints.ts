import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import {
  IMagentoWebhookModuleService,
  MAGENTO_WEBHOOK_MODULE,
  UpdateMagentoWebhookEndpointDTO,
} from "../../../types"

export type UpdateMagentoWebhookEndpointsStepInput = UpdateMagentoWebhookEndpointDTO[]

export const updateMagentoWebhookEndpointsStepId = "update-magento-webhook-endpoints"
export const updateMagentoWebhookEndpointsStep = createStep(
  updateMagentoWebhookEndpointsStepId,
  async (data: UpdateMagentoWebhookEndpointsStepInput, { container }) => {
    const service = container.resolve<IMagentoWebhookModuleService>(MAGENTO_WEBHOOK_MODULE)

    const previous = await service.listMagentoWebhookEndpoints({
      id: data.map((d) => d.id),
    })

    const endpoints = await service.updateMagentoWebhookEndpoints(data)

    return new StepResponse(
      endpoints,
      previous.map((e) => ({
        id: e.id,
        url: e.url,
        secret: e.secret,
        events: e.events,
        is_active: e.is_active,
        description: e.description,
        metadata: e.metadata,
      }))
    )
  },
  async (previous, { container }) => {
    if (!previous?.length) {
      return
    }

    const service = container.resolve<IMagentoWebhookModuleService>(MAGENTO_WEBHOOK_MODULE)
    await service.updateMagentoWebhookEndpoints(previous)
  }
)
