import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"

export type UpdatePayoutsStepInput = Extract<Parameters<PayoutModuleService["updatePayouts"]>[0], unknown[]>

export const updatePayoutsStepId = "update-payouts"

export const updatePayoutsStep = createStep(
  updatePayoutsStepId,
  async (input: UpdatePayoutsStepInput, { container }) => {
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
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

    await container.resolve<PayoutModuleService>(MercurModules.PAYOUT).updatePayouts(previous)
  }
)
