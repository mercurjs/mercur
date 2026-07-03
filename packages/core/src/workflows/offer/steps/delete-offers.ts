import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import OfferModuleService from "../../../modules/offer/service"

export type DeleteOffersStepInput = {
  ids: string[]
}

export const deleteOffersStep = createStep(
  "delete-offers",
  async (input: DeleteOffersStepInput, { container }) => {
    const ids = input.ids ?? []
    if (!ids.length) {
      return new StepResponse({ ids: [] as string[] }, { ids: [] as string[] })
    }
    const service = container.resolve<OfferModuleService>(MercurModules.OFFER)
    await service.softDeleteOffers(ids)
    return new StepResponse({ ids }, { ids })
  },
  async (compensation, { container }) => {
    if (!compensation?.ids?.length) {
      return
    }
    const service = container.resolve<OfferModuleService>(MercurModules.OFFER)
    await service.restoreOffers(compensation.ids)
  },
)
