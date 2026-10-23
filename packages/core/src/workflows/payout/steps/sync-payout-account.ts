import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules, PayoutAccountDTO } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"

export const syncPayoutAccountStepId = "sync-payout-account"

export const syncPayoutAccountStep = createStep(
  syncPayoutAccountStepId,
  async (input: { account_id: string }, { container }) => {
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)

    const previous = await service.retrievePayoutAccount(input.account_id)
    const account: PayoutAccountDTO = await service.syncPayoutAccount(input.account_id)

    return new StepResponse(account, {
      id: input.account_id,
      status: previous.status,
      kyc_status: previous.kyc_status,
      payouts_enabled: previous.payouts_enabled,
      charges_enabled: previous.charges_enabled,
      details_submitted: previous.details_submitted,
      disabled_reason: previous.disabled_reason,
      onboarding_token: previous.onboarding_token,
    })
  },
  async (previous, { container }) => {
    if (!previous) return
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
    await service.updatePayoutAccounts(previous)
  }
)

export const refreshLoginLinkStepId = "refresh-login-link"

export const refreshLoginLinkStep = createStep(
  refreshLoginLinkStepId,
  async (input: { account_id: string }, { container }) => {
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)

    const onboarding = await service.refreshLoginLink(input.account_id)

    return new StepResponse(onboarding)
  }
)
