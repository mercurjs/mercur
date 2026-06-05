import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CreateCommissionRateDTO, MercurModules } from "@mercurjs/types"

import CommissionModuleService from "../../../modules/commission/service"

export const createCommissionRatesStepId = "create-commission-rates-step"

export const createCommissionRatesStep = createStep(
  createCommissionRatesStepId,
  async (input: CreateCommissionRateDTO[], { container }) => {
    const commissionService = container.resolve<CommissionModuleService>(
      MercurModules.COMMISSION
    )

    const commissionRates = await commissionService.createCommissionRates(input)

    return new StepResponse(
      commissionRates,
      commissionRates.map((rate) => rate.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) return

    const commissionService = container.resolve<CommissionModuleService>(
      MercurModules.COMMISSION
    )

    await commissionService.deleteCommissionRates(ids)
  }
)
