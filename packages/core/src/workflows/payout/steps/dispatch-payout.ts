import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules, PayoutDTO } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"

export const dispatchPayoutsStepId = "dispatch-payouts"

export const dispatchPayoutsStep = createStep(
  dispatchPayoutsStepId,
  async (input: { payout_ids: string[] }, { container }) => {
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)

    const payouts: PayoutDTO[] = []
    for (const id of input.payout_ids) {
      payouts.push(await service.dispatchPayout(id))
    }

    return new StepResponse(payouts)
  }
)
