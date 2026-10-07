import { createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import OfferModuleService from "../../../modules/offer/service"

export const validateOfferConditionsStepId = "validate-offer-conditions"

export type ValidateOfferConditionsStepInput = {
  condition_ids: string[]
}

export const validateOfferConditionsStep = createStep(
  validateOfferConditionsStepId,
  async ({ condition_ids }: ValidateOfferConditionsStepInput, { container }) => {
    const ids = Array.from(new Set(condition_ids))
    if (!ids.length) {
      return
    }

    const service = container.resolve<OfferModuleService>(MercurModules.OFFER)
    const conditions = await service.listOfferConditions({ id: ids })
    const byId = new Map(conditions.map((c) => [c.id, c]))

    for (const id of ids) {
      const condition = byId.get(id)
      if (!condition) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Offer condition with id ${id} was not found`
        )
      }
      if (!condition.is_active) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Offer condition ${condition.code} is not active`
        )
      }
    }
  }
)
