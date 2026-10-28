import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules, PayoutReversalDTO } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"

export type ProcessPayoutReversalsStepInput = {
  ids: string[]
}

export const processPayoutReversalsStepId = "process-payout-reversals"

export const processPayoutReversalsStep = createStep(
  processPayoutReversalsStepId,
  async (input: ProcessPayoutReversalsStepInput, { container }) => {
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)

    const reversals: PayoutReversalDTO[] = []
    for (const id of input.ids) {
      reversals.push(await service.processPayoutReversal(id))
    }

    return new StepResponse(reversals)
  }
  // Not compensated: money that reached the provider cannot be pulled back by a rollback.
)
