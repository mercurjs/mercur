import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"

export type UpdatePayoutAccountStepInput = {
  id: string
}

export const updatePayoutAccountStepId = "update-payout-account"

/**
 * Refreshes the account from the provider.
 */
export const updatePayoutAccountStep = createStep(
  updatePayoutAccountStepId,
  async (input: UpdatePayoutAccountStepInput, { container }) => {
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)

    const previous = await service.retrievePayoutAccount(input.id)
    const account = await service.updatePayoutAccount(input.id)

    return new StepResponse(account, {
      id: previous.id,
      status: previous.status,
      kyc_status: previous.kyc_status,
      payouts_enabled: previous.payouts_enabled,
      charges_enabled: previous.charges_enabled,
      details_submitted: previous.details_submitted,
      disabled_reason: previous.disabled_reason,
      onboarding_token: previous.onboarding_token,
      last_synced_at: previous.last_synced_at,
      data: previous.data,
    })
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }

    await container.resolve<PayoutModuleService>(MercurModules.PAYOUT).updatePayoutAccounts(previous)
  }
)
