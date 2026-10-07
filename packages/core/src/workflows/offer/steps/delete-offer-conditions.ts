import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import OfferModuleService from "../../../modules/offer/service"

export const deleteOfferConditionsStepId = "delete-offer-conditions"

export const deleteOfferConditionsStep = createStep(
  deleteOfferConditionsStepId,
  async (ids: string[], { container }) => {
    const service = container.resolve<OfferModuleService>(MercurModules.OFFER)
    await service.softDeleteOfferConditions(ids)
    return new StepResponse(void 0, ids)
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return
    }
    const service = container.resolve<OfferModuleService>(MercurModules.OFFER)
    await service.restoreOfferConditions(ids)
  }
)
