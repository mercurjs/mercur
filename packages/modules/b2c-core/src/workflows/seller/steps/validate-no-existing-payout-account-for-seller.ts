import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'
import { createStep } from '@medusajs/framework/workflows-sdk'

import sellerPayoutAccountLink from '../../../links/seller-payout-account'

type ValidateNoExistingPayoutAccountInput = {
  seller_id: string
  payment_provider_id: string
}

export const validateNoExistingPayoutAccountForSellerStep = createStep(
  'validate-no-existing-payout-account-for-seller',
  async (input: ValidateNoExistingPayoutAccountInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: sellerPayoutAccountRelations } = await query.graph({
      entity: sellerPayoutAccountLink.entryPoint,
      fields: ['id', 'payout_account.*'],
      filters: { 
        seller_id: input.seller_id,
      }
    })

    const existingPayoutAccount = sellerPayoutAccountRelations.find(
      (relation: any) => relation.payout_account?.payment_provider_id === input.payment_provider_id
    )

    if (existingPayoutAccount) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        `Payment account already exists for seller with payment provider ${input.payment_provider_id}`
      )
    }
  }
)
