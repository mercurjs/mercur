import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules, UpdatePayoutAccountDTO } from "@mercurjs/types"

import PayoutService from "../../../modules/payout/services/payout-service"

export const updatePayoutAccountStepId = "update-payout-account-step"

export const updatePayoutAccountStep = createStep(
  updatePayoutAccountStepId,
  async (input: UpdatePayoutAccountDTO, { container }) => {
    const payoutService = container.resolve<PayoutService>(MercurModules.PAYOUT)

    const previousAccount = await payoutService.retrievePayoutAccount(input.id)

    const updatedAccount = await payoutService.updatePayoutAccounts({
      id: input.id,
      status: input.status,
    })

    return new StepResponse(updatedAccount, {
      id: input.id,
      previousStatus: previousAccount.status,
    })
  },
  async (rollbackData, { container }) => {
    if (!rollbackData) return

    const payoutService = container.resolve<PayoutService>(MercurModules.PAYOUT)

    await payoutService.updatePayoutAccounts({
      id: rollbackData.id,
      status: rollbackData.previousStatus,
    })
  }
)
