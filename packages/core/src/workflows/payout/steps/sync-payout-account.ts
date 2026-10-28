import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { IPayoutModuleService, MercurModules } from "@mercurjs/types"

export type SyncPayoutAccountStepInput = {
  id: string
}

export const syncPayoutAccountStepId = "sync-payout-account-step"

/**
 * Pulls the account from the provider and stores its state.
 */
export const syncPayoutAccountStep = createStep(
  syncPayoutAccountStepId,
  async (input: SyncPayoutAccountStepInput, { container }) => {
    const service = container.resolve<IPayoutModuleService>(MercurModules.PAYOUT)

    const previous = await service.retrievePayoutAccount(input.id)
    const account = await service.syncPayoutAccount(input.id)

    return new StepResponse(account, {
      id: previous.id,
      status: previous.status,
      kyc_status: previous.kyc_status,
      payouts_enabled: previous.payouts_enabled,
      charges_enabled: previous.charges_enabled,
      details_submitted: previous.details_submitted,
      disabled_reason: previous.disabled_reason,
      onboarding_token: previous.onboarding_token,
      onboarding_token_issued_at: previous.onboarding_token_issued_at,
      last_synced_at: previous.last_synced_at,
      data: previous.data,
    })
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }

    await container.resolve<IPayoutModuleService>(MercurModules.PAYOUT).updatePayoutAccounts(previous)
  }
)
