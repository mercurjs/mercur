import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { IPayoutModuleService, MercurModules } from "@mercurjs/types"

export type CreatePayoutAccountsStepInput = {
  external_id: string
  data?: Record<string, unknown>
}[]

export const createPayoutAccountsStepId = "create-payout-accounts"

/**
 * Stores accounts that already exist at the provider, without calling it.
 * Compensation only removes the stored rows: the provider accounts predate
 * the workflow.
 */
export const createPayoutAccountsStep = createStep(
  createPayoutAccountsStepId,
  async (input: CreatePayoutAccountsStepInput, { container }) => {
    const service = container.resolve<IPayoutModuleService>(MercurModules.PAYOUT)
    const accounts = input.length ? await service.createPayoutAccounts(input) : []

    return new StepResponse(
      accounts,
      accounts.map((account) => account.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return
    }

    await container.resolve<IPayoutModuleService>(MercurModules.PAYOUT).deletePayoutAccounts(ids)
  }
)
