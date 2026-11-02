import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { CreatePayoutReversalDTO, IPayoutModuleService, MercurModules } from "@mercurjs/types"

import { sentToProvider } from "../utils/sent-to-provider"

export type CreatePayoutReversalsStepInput = CreatePayoutReversalDTO[]

export const createPayoutReversalsStepId = "create-payout-reversals-step"

export const createPayoutReversalsStep = createStep(
  createPayoutReversalsStepId,
  async (input: CreatePayoutReversalsStepInput, { container }) => {
    const service = container.resolve<IPayoutModuleService>(MercurModules.PAYOUT)
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

    const service = container.resolve<IPayoutModuleService>(MercurModules.PAYOUT)
    const current = await service.listPayoutReversals({ id: ids }, { select: ["id", "status", "data"], take: null })
    const unsent = current.filter((reversal) => !sentToProvider(reversal)).map((reversal) => reversal.id)

    if (unsent.length) {
      await service.deletePayoutReversals(unsent)
    }
  }
)
