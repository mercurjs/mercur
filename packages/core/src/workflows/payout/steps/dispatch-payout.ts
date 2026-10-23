import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules, PayoutDTO } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"

export const dispatchPayoutStepId = "dispatch-payout"

export const dispatchPayoutStep = createStep(
  dispatchPayoutStepId,
  async (input: { payout_id: string }, { container }) => {
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)

    const payout: PayoutDTO = await service.dispatchPayout(input.payout_id)

    return new StepResponse(payout)
  }
)
