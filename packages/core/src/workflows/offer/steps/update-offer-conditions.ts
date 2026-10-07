import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules, UpdateOfferConditionDTO } from "@mercurjs/types"

import OfferModuleService from "../../../modules/offer/service"

export const updateOfferConditionsStepId = "update-offer-conditions"

export const updateOfferConditionsStep = createStep(
  updateOfferConditionsStepId,
  async (input: UpdateOfferConditionDTO[], { container }) => {
    const service = container.resolve<OfferModuleService>(MercurModules.OFFER)

    const ids = input.map((c) => c.id)
    const before = await service.listOfferConditions({ id: ids })

    const conditions = await service.updateOfferConditions(
      input.map(({ id, ...data }) => ({ selector: { id }, data }))
    )

    const compensation = before.map((prev) => ({
      id: prev.id,
      code: prev.code,
      label: prev.label,
      is_active: prev.is_active,
      rank: prev.rank,
      metadata: prev.metadata ?? null,
    }))

    return new StepResponse(conditions, compensation)
  },
  async (compensation, { container }) => {
    if (!compensation?.length) {
      return
    }
    const service = container.resolve<OfferModuleService>(MercurModules.OFFER)
    await service.updateOfferConditions(
      compensation.map(({ id, ...data }) => ({ selector: { id }, data }))
    )
  }
)
