import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import CommissionModuleService from "../../../modules/commission/service"

export const deleteCommissionRatesStepId = "delete-commission-rates-step"

export const deleteCommissionRatesStep = createStep(
  deleteCommissionRatesStepId,
  async (ids: string[], { container }) => {
    const commissionService = container.resolve<CommissionModuleService>(
      MercurModules.COMMISSION
    )

    await commissionService.softDeleteCommissionRates(ids)

    return new StepResponse(void 0, ids)
  },
  async (ids, { container }) => {
    if (!ids?.length) return

    const commissionService = container.resolve<CommissionModuleService>(
      MercurModules.COMMISSION
    )

    await commissionService.restoreCommissionRates(ids)
  }
)
