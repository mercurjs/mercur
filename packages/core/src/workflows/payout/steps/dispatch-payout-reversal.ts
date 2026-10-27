import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules, PayoutReversalDTO } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"

export const dispatchPayoutReversalsStepId = "dispatch-payout-reversals"

export const dispatchPayoutReversalsStep = createStep(
  dispatchPayoutReversalsStepId,
  async (input: { reversal_ids: string[] }, { container }) => {
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)

    const reversals: PayoutReversalDTO[] = []
    for (const id of input.reversal_ids) {
      reversals.push(await service.dispatchPayoutReversal(id))
    }

    return new StepResponse(reversals)
  }
)
