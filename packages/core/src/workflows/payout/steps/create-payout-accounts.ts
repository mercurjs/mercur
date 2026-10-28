import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"

export type CreatePayoutAccountsStepInput = {
  external_id: string
  data?: Record<string, unknown>
}[]

export const createPayoutAccountsStepId = "create-payout-accounts"

/**
 * Stores accounts that already exist at the provider, without calling it.
 */
export const createPayoutAccountsStep = createStep(
  createPayoutAccountsStepId,
  async (input: CreatePayoutAccountsStepInput, { container }) => {
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
    const accounts = await service.createPayoutAccounts(input)

    return new StepResponse(
      accounts,
      accounts.map((account) => account.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return
    }

    await container.resolve<PayoutModuleService>(MercurModules.PAYOUT).deletePayoutAccounts(ids)
  }
)
