import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { CreatePayoutDTO, IPayoutModuleService, MercurModules } from "@mercurjs/types"

import { sentToProvider } from "../utils/sent-to-provider"

export type CreatePayoutsStepInput = CreatePayoutDTO[]

export const createPayoutsStepId = "create-payouts"

export const createPayoutsStep = createStep(
  createPayoutsStepId,
  async (input: CreatePayoutsStepInput, { container }) => {
    const service = container.resolve<IPayoutModuleService>(MercurModules.PAYOUT)
    const payouts = input.length ? await service.createPayouts(input) : []

    return new StepResponse(
      payouts,
      payouts.map((payout) => payout.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return
    }

    const service = container.resolve<IPayoutModuleService>(MercurModules.PAYOUT)
    const current = await service.listPayouts({ id: ids }, { select: ["id", "status", "data"], take: null })
    const unsent = current.filter((payout) => !sentToProvider(payout)).map((payout) => payout.id)

    if (unsent.length) {
      await service.deletePayouts(unsent)
    }
  }
)
