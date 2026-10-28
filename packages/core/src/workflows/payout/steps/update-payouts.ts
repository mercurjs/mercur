import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { IPayoutModuleService, MercurModules, UpdatePayoutDTO } from "@mercurjs/types"

import { sentToProvider } from "../utils/sent-to-provider"

export type UpdatePayoutsStepInput = UpdatePayoutDTO[]

export const updatePayoutsStepId = "update-payouts"

export const updatePayoutsStep = createStep(
  updatePayoutsStepId,
  async (input: UpdatePayoutsStepInput, { container }) => {
    const service = container.resolve<IPayoutModuleService>(MercurModules.PAYOUT)
    const previous = input.length ? await service.listPayouts({ id: input.map((payout) => payout.id) }, { take: null }) : []
    const payouts = input.length ? await service.updatePayouts(input) : []

    return new StepResponse(
      payouts,
      previous.map(({ id, account_id, amount, status, status_reason, data }) => ({
        id,
        account_id,
        amount,
        status,
        status_reason,
        data,
      }))
    )
  },
  async (previous, { container }) => {
    if (!previous?.length) {
      return
    }

    const service = container.resolve<IPayoutModuleService>(MercurModules.PAYOUT)
    const current = new Map(
      (
        await service.listPayouts({ id: previous.map((payout) => payout.id) }, { select: ["id", "status", "data"], take: null })
      ).map((payout) => [payout.id, payout])
    )
    const restorable = previous.filter((payout) => {
      const now = current.get(payout.id)
      return now && !sentToProvider(now, payout)
    })

    if (restorable.length) {
      await service.updatePayouts(restorable)
    }
  }
)
