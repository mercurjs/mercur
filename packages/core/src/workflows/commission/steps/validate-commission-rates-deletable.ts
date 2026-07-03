import { createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import CommissionModuleService from "../../../modules/commission/service"

export const validateCommissionRatesDeletableStepId =
  "validate-commission-rates-deletable-step"

export const validateCommissionRatesDeletableStep = createStep(
  validateCommissionRatesDeletableStepId,
  async (ids: string[], { container }) => {
    if (!ids?.length) {
      return
    }

    const commissionService = container.resolve<CommissionModuleService>(
      MercurModules.COMMISSION
    )

    const rates = await commissionService.listCommissionRates({ id: ids })

    const defaultRate = rates.find((rate) => rate.is_default)
    if (defaultRate) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "The global (default) commission rate cannot be deleted"
      )
    }
  }
)
