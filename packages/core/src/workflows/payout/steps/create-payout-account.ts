import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { CreatePayoutAccountDTO, MercurModules } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"

export const createPayoutAccountStepId = "create-payout-account"

export const createPayoutAccountStep = createStep(
  createPayoutAccountStepId,
  async (input: CreatePayoutAccountDTO, { container }) => {
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
    const payoutAccount = await service.createPayoutAccount(input)

    return new StepResponse(payoutAccount, payoutAccount.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }

    await container.resolve<PayoutModuleService>(MercurModules.PAYOUT).deletePayoutAccounts(id)
  }
)
