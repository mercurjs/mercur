import sellerPayoutAccountLink from '#/links/seller-payout-account'

import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'
import { createStep } from '@medusajs/framework/workflows-sdk'

export const checkIfPayoutAccountExistsForSellerStep = createStep(
  'check-if-payment-account-exists-for-seller',
  async (sellerId: string, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: sellerPayoutAccountRelations } = await query.graph({
      entity: sellerPayoutAccountLink.entryPoint,
      fields: ['id'],
      filters: { seller_id: sellerId }
    })

    if (sellerPayoutAccountRelations.length > 0) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        'Payment account already exists for seller'
      )
    }
  }
)
