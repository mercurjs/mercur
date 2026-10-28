import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"

export type CreatePayoutReversalsStepInput = Extract<Parameters<PayoutModuleService["createPayoutReversals"]>[0], unknown[]>

export const createPayoutReversalsStepId = "create-payout-reversals"

export const createPayoutReversalsStep = createStep(
  createPayoutReversalsStepId,
  async (input: CreatePayoutReversalsStepInput, { container }) => {
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
    const reversals = input.length ? await service.createPayoutReversals(input) : []

    return new StepResponse(
      reversals,
      reversals.map((reversal) => reversal.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return
    }

    await container.resolve<PayoutModuleService>(MercurModules.PAYOUT).deletePayoutReversals(ids)
  }
)
