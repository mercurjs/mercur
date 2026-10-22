import { MedusaError } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { IMagentoWebhookModuleService, MAGENTO_WEBHOOK_MODULE } from "../../../types"

export type ValidateMagentoWebhookDeliveryStepInput = {
  delivery_id: string
  endpoint_id?: string
  force?: boolean
}

export const validateMagentoWebhookDeliveryStepId = "validate-magento-webhook-delivery"
export const validateMagentoWebhookDeliveryStep = createStep(
  validateMagentoWebhookDeliveryStepId,
  async (input: ValidateMagentoWebhookDeliveryStepInput, { container }) => {
    const service = container.resolve<IMagentoWebhookModuleService>(MAGENTO_WEBHOOK_MODULE)

    const delivery = await service.retrieveMagentoWebhookDelivery(input.delivery_id, {
      relations: ["endpoint"],
    })

    if (input.endpoint_id && delivery.endpoint_id !== input.endpoint_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Delivery with id "${input.delivery_id}" not found`
      )
    }

    const skip =
      !input.force && (delivery.status === "delivered" || delivery.status === "dead")

    return new StepResponse({ delivery, skip })
  }
)
