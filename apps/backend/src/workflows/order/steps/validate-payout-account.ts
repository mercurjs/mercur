import { PayoutAccountDTO, PayoutAccountStatus } from '#/modules/payout/types'

import { MedusaError } from '@medusajs/framework/utils'
import { createStep } from '@medusajs/framework/workflows-sdk'

export const validatePayoutAccountStep = createStep(
  'validate-payout-account',
  async (account: PayoutAccountDTO) => {
    if (account.status !== PayoutAccountStatus.ACTIVE) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Payout account is not active: ${account.id}`
      )
    }
  }
)
