import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { CreateOnboardingDTO } from '@mercurjs/framework'

import {
  createPayoutOnboardingStep,
  validatePayoutAccountExistsForSellerStep
} from '../steps'

type CreateOnboardingForSellerInput = {
  context: CreateOnboardingDTO['context']
  seller_id: string
}

export const createOnboardingForSellerWorkflow = createWorkflow(
  'create-onboarding-for-seller',
  function (input: CreateOnboardingForSellerInput) {
    const { id } = validatePayoutAccountExistsForSellerStep(input.seller_id)

    const onboarding = createPayoutOnboardingStep({
      context: input.context,
      payout_account_id: id
    })

    return new WorkflowResponse(onboarding)
  }
)
