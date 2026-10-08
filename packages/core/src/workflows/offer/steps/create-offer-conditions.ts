import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { CreateOfferConditionDTO, MercurModules } from "@mercurjs/types"

import OfferModuleService from "../../../modules/offer/service"

export const createOfferConditionsStepId = "create-offer-conditions"

export const createOfferConditionsStep = createStep(
  createOfferConditionsStepId,
  async (input: CreateOfferConditionDTO[], { container }) => {
    const service = container.resolve<OfferModuleService>(MercurModules.OFFER)
    const conditions = await service.createOfferConditions(input)
    return new StepResponse(
      conditions,
      conditions.map((c) => c.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return
    }
    const service = container.resolve<OfferModuleService>(MercurModules.OFFER)
    await service.deleteOfferConditions(ids)
  }
)
