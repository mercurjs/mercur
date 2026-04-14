import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules, UpdatePayoutDTO } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"

export const updatePayoutStepId = "update-payout-step"

export const updatePayoutStep = createStep(
  updatePayoutStepId,
  async (input: UpdatePayoutDTO, { container }) => {
    const payoutService = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)

    const previousPayout = await payoutService.retrievePayout(input.id)

    const updatedPayout = await payoutService.updatePayouts({
      id: input.id,
      status: input.status,
    })

    return new StepResponse(updatedPayout, {
      id: input.id,
      previousStatus: previousPayout.status,
    })
  },
  async (rollbackData, { container }) => {
    if (!rollbackData) return

    const payoutService = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)

    await payoutService.updatePayouts({
      id: rollbackData.id,
      status: rollbackData.previousStatus,
    })
  }
)
