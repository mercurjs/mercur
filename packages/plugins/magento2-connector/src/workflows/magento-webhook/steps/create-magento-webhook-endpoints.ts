import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import {
  CreateMagentoWebhookEndpointDTO,
  IMagentoWebhookModuleService,
  MAGENTO_WEBHOOK_MODULE,
} from "../../../types"

export type CreateMagentoWebhookEndpointsStepInput = CreateMagentoWebhookEndpointDTO[]

export const createMagentoWebhookEndpointsStepId = "create-magento-webhook-endpoints"
export const createMagentoWebhookEndpointsStep = createStep(
  createMagentoWebhookEndpointsStepId,
  async (data: CreateMagentoWebhookEndpointsStepInput, { container }) => {
    const service = container.resolve<IMagentoWebhookModuleService>(MAGENTO_WEBHOOK_MODULE)

    const endpoints = await service.createMagentoWebhookEndpoints(data)

    return new StepResponse(
      endpoints,
      endpoints.map((e) => e.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return
    }

    const service = container.resolve<IMagentoWebhookModuleService>(MAGENTO_WEBHOOK_MODULE)
    await service.softDeleteMagentoWebhookEndpoints(ids)
  }
)
