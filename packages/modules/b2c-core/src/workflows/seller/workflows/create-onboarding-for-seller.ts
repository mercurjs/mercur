import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { CreateOnboardingDTO } from '@mercurjs/framework'

import {
  createPayoutOnboardingStep,
  validatePayoutAccountExistsForSellerStep
} from '../steps'
import { PaymentProvider } from '../../../api/vendor/payout-account/types'

type CreateOnboardingForSellerInput = {
  context: CreateOnboardingDTO['context']
  seller_id: string
  payment_provider_id: PaymentProvider
}

export const createOnboardingForSellerWorkflow = createWorkflow(
  'create-onboarding-for-seller',
  function (input: CreateOnboardingForSellerInput) {
    const { id } = validatePayoutAccountExistsForSellerStep({
      seller_id: input.seller_id,
      payment_provider_id: input.payment_provider_id
    })

    const onboarding = createPayoutOnboardingStep({
      context: input.context,
      payout_account_id: id
    })

    return new WorkflowResponse(onboarding)
  }
)
