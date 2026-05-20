import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import OfferModuleService from "../../../modules/offer/service"

export const deleteOffersStep = createStep(
  "delete-offers",
  async (ids: string[], { container }) => {
    const service = container.resolve<OfferModuleService>(MercurModules.OFFER)
    await service.softDeleteOffers(ids)
    return new StepResponse(void 0, ids)
  },
  async (ids: string[] | undefined, { container }) => {
    if (!ids?.length) {
      return
    }
    const service = container.resolve<OfferModuleService>(MercurModules.OFFER)
    await service.restoreOffers(ids)
  }
)
