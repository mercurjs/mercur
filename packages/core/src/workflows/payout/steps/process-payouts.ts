import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules, PayoutDTO } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"

export type ProcessPayoutsStepInput = {
  ids: string[]
}

export const processPayoutsStepId = "process-payouts"

export const processPayoutsStep = createStep(
  processPayoutsStepId,
  async (input: ProcessPayoutsStepInput, { container }) => {
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)

    const payouts: PayoutDTO[] = []
    for (const id of input.ids) {
      payouts.push(await service.processPayout(id))
    }

    return new StepResponse(payouts)
  }
  // Not compensated: money that reached the provider cannot be pulled back by a rollback.
)
