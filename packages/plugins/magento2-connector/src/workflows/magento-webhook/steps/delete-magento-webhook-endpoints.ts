import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { IMagentoWebhookModuleService, MAGENTO_WEBHOOK_MODULE } from "../../../types"

export type DeleteMagentoWebhookEndpointsStepInput = string[]

export const deleteMagentoWebhookEndpointsStepId = "delete-magento-webhook-endpoints"
export const deleteMagentoWebhookEndpointsStep = createStep(
  deleteMagentoWebhookEndpointsStepId,
  async (ids: DeleteMagentoWebhookEndpointsStepInput, { container }) => {
    const service = container.resolve<IMagentoWebhookModuleService>(MAGENTO_WEBHOOK_MODULE)

    await service.softDeleteMagentoWebhookEndpoints(ids)

    return new StepResponse(void 0, ids)
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return
    }

    const service = container.resolve<IMagentoWebhookModuleService>(MAGENTO_WEBHOOK_MODULE)
    await service.restoreMagentoWebhookEndpoints(ids)
  }
)
