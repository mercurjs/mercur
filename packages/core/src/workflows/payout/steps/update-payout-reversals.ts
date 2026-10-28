import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { IPayoutModuleService, MercurModules, UpdatePayoutReversalDTO } from "@mercurjs/types"

import { sentToProvider } from "../utils/sent-to-provider"

export type UpdatePayoutReversalsStepInput = UpdatePayoutReversalDTO[]

export const updatePayoutReversalsStepId = "update-payout-reversals"

export const updatePayoutReversalsStep = createStep(
  updatePayoutReversalsStepId,
  async (input: UpdatePayoutReversalsStepInput, { container }) => {
    const service = container.resolve<IPayoutModuleService>(MercurModules.PAYOUT)
    const previous = input.length
      ? await service.listPayoutReversals({ id: input.map((reversal) => reversal.id) }, { take: null })
      : []
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

    const service = container.resolve<IPayoutModuleService>(MercurModules.PAYOUT)
    const current = new Map(
      (
        await service.listPayoutReversals(
          { id: previous.map((reversal) => reversal.id) },
          { select: ["id", "status", "data"], take: null }
        )
      ).map((reversal) => [reversal.id, reversal])
    )
    const restorable = previous.filter((reversal) => {
      const now = current.get(reversal.id)
      return now && !sentToProvider(now, reversal)
    })

    if (restorable.length) {
      await service.updatePayoutReversals(restorable)
    }
  }
)
