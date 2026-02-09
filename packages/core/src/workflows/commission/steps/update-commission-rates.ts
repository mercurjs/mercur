import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { UpdateCommissionRateDTO, MercurModules } from "@mercurjs/types"

import CommissionModuleService from "../../../modules/commission/service"

export const updateCommissionRatesStepId = "update-commission-rates-step"

export const updateCommissionRatesStep = createStep(
  updateCommissionRatesStepId,
  async (input: UpdateCommissionRateDTO[], { container }) => {
    const commissionService = container.resolve<CommissionModuleService>(
      MercurModules.COMMISSION
    )

    const commissionRates = await commissionService.updateCommissionRates(input)

    return new StepResponse(
      commissionRates,
      input
    )
  },
  async (prevData, { container }) => {
    if (!prevData?.length) return

    const commissionService = container.resolve<CommissionModuleService>(
      MercurModules.COMMISSION
    )

    await commissionService.updateCommissionRates(prevData)
  }
)
