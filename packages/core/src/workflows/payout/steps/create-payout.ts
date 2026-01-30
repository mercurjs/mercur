import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CreatePayoutDTO, MercurModules } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"

export const createPayoutStepId = "create-payout-step"

export const createPayoutStep = createStep(
  createPayoutStepId,
  async (input: CreatePayoutDTO, { container }) => {
    const payoutService = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)

    const payout = await payoutService.createPayouts(input)

    return new StepResponse(payout, payout.id)
  }
)
