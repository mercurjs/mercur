import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"

export type UpdatePayoutReversalsStepInput = Extract<Parameters<PayoutModuleService["updatePayoutReversals"]>[0], unknown[]>

export const updatePayoutReversalsStepId = "update-payout-reversals"

export const updatePayoutReversalsStep = createStep(
  updatePayoutReversalsStepId,
  async (input: UpdatePayoutReversalsStepInput, { container }) => {
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
    const previous = input.length ? await service.listPayoutReversals({ id: input.map((reversal) => reversal.id) }, { take: null }) : []
    const reversals = input.length ? await service.updatePayoutReversals(input) : []

    return new StepResponse(
      reversals,
      previous.map(({ id, amount, status, status_reason, data }) => ({ id, amount, status, status_reason, data }))
    )
  },
  async (previous, { container }) => {
    if (!previous?.length) {
      return
    }

    await container.resolve<PayoutModuleService>(MercurModules.PAYOUT).updatePayoutReversals(previous)
  }
)
