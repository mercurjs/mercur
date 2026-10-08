import { createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import OfferModuleService from "../../../modules/offer/service"

export const validateOfferConditionsDeletableStepId =
  "validate-offer-conditions-deletable"

export const validateOfferConditionsDeletableStep = createStep(
  validateOfferConditionsDeletableStepId,
  async (ids: string[], { container }) => {
    if (!ids?.length) {
      return
    }

    const service = container.resolve<OfferModuleService>(MercurModules.OFFER)

    const conditions = await service.listOfferConditions({ id: ids })
    const missing = ids.find((id) => !conditions.some((c) => c.id === id))
    if (missing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Offer condition with id ${missing} was not found`
      )
    }

    const [, inUse] = await service.listAndCountOffers(
      { condition_id: ids },
      { select: ["id"], take: 1 }
    )
    if (inUse > 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Offer conditions that are assigned to offers cannot be deleted"
      )
    }
  }
)
