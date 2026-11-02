import { createOffersWorkflow } from "@mercurjs/core/workflows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

createOffersWorkflow.hooks.offersCreated(
  ({ offers_additional_data }, { container }) => {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    logger.info(
      `offersCreated additional_data: ${JSON.stringify(offers_additional_data)}`
    )
  }
)
