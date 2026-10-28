import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"

export type CreatePayoutsStepInput = Extract<Parameters<PayoutModuleService["createPayouts"]>[0], unknown[]>

export const createPayoutsStepId = "create-payouts"

export const createPayoutsStep = createStep(
  createPayoutsStepId,
  async (input: CreatePayoutsStepInput, { container }) => {
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
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

    await container.resolve<PayoutModuleService>(MercurModules.PAYOUT).deletePayouts(ids)
  }
)
