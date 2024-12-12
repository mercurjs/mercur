import { PAYOUTS_MODULE } from '#/modules/payouts'
import { CreatePaymentAccountDTO } from '#/modules/payouts/types'
import { SELLER_MODULE } from '#/modules/seller'

import { createRemoteLinkStep } from '@medusajs/medusa/core-flows'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { createPaymentAccountStep } from '../steps'

type CreatePaymentAccountForSellerInput = {
  payment_account: CreatePaymentAccountDTO
  seller_id: string
}

export const createPaymentAccountForSellerWorkflow = createWorkflow(
  'create-payment-account-for-seller',
  function (input: CreatePaymentAccountForSellerInput) {
    const paymentAccount = createPaymentAccountStep(input.payment_account)

    createRemoteLinkStep([
      {
        [SELLER_MODULE]: {
          seller_id: input.seller_id
        },
        [PAYOUTS_MODULE]: {
          payment_account_id: paymentAccount.id
        }
      }
    ])

    return new WorkflowResponse(paymentAccount)
  }
)
