import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'
import { createStep } from '@medusajs/framework/workflows-sdk'

import sellerPayoutAccountLink from '../../../links/seller-payout-account'

export const validateNoExistingPayoutAccountForSellerStep = createStep(
  'validate-no-existing-payout-account-for-seller',
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
