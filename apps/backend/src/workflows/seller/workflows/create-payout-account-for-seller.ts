import { PAYOUT_MODULE } from '#/modules/payout'
import { CreatePayoutAccountDTO } from '#/modules/payout/types'
import { SELLER_MODULE } from '#/modules/seller'

import { createRemoteLinkStep } from '@medusajs/medusa/core-flows'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import {
  checkIfPayoutAccountExistsForSellerStep,
  createPayoutAccountStep
} from '../steps'
import { updateOnboardingStep } from '../steps/update-onboarding'

type CreatePayoutAccountForSellerInput = {
  payout_account: CreatePayoutAccountDTO
  seller_id: string
}

export const createPayoutAccountForSellerWorkflow = createWorkflow(
  'create-payment-account-for-seller',
  function (input: CreatePayoutAccountForSellerInput) {
    const payoutAccount = createPayoutAccountStep(input.payout_account)

    createRemoteLinkStep([
      {
        [SELLER_MODULE]: {
          seller_id: input.seller_id
        },
        [PAYOUT_MODULE]: {
          payout_account_id: payoutAccount.id
        }
      }
    ])

    updateOnboardingStep({
      is_payout_account_setup_completed: true,
      seller_id: input.seller_id
    })

    return new WorkflowResponse(payoutAccount)
  }
)
