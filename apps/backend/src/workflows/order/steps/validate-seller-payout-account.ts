import { createStep } from '@medusajs/framework/workflows-sdk'
import { MedusaError } from '@medusajs/utils'

import { PayoutAccountStatus } from '../../../modules/payout/types'
import { SellerWithPayoutAccountDTO } from '../../../modules/seller/types'

export const validateSellerPayoutAccountStep = createStep(
  'validate-seller-payout-account',
  async (seller: SellerWithPayoutAccountDTO) => {
    if (!seller.payout_account) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Seller has no payout account'
      )
    }

    if (seller.payout_account.status !== PayoutAccountStatus.ACTIVE) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Seller payout account is not active'
      )
    }
  }
)
