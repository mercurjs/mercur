import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CreatePayoutDTO, MercurModules } from "@mercurjs/types"

import PayoutService from "../../../modules/payout/services/payout-service"

export const createPayoutStepId = "create-payout-step"

export const createPayoutStep = createStep(
  createPayoutStepId,
  async (input: CreatePayoutDTO, { container }) => {
    const payoutService = container.resolve<PayoutService>(MercurModules.PAYOUT)

    const payout = await payoutService.createPayout(input)

    return new StepResponse(payout, payout.id)
  }
)
