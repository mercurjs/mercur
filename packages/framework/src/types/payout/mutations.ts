import { BigNumberInput } from '@medusajs/framework/types'

import { OnboardingDTO, PayoutAccountDTO } from './common'

export interface CreatePayoutAccountDTO {
  context: Record<string, unknown>
}

export interface UpdatePayoutAccountDTO
  extends Omit<Partial<PayoutAccountDTO>, 'id' | 'created_at' | 'updated_at'> {
  id: string
}

export interface CreateOnboardingDTO
  extends Omit<
    Partial<OnboardingDTO>,
    'id' | 'created_at' | 'updated_at' | 'data'
  > {
  payout_account_id: string
  context: Record<string, unknown>
}

export type CreatePayoutDTO = {
  amount: BigNumberInput
  currency_code: string
  account_id: string
  transaction_id: string
  source_transaction: string
}

export type CreatePayoutReversalDTO = {
  payout_id: string
  amount: BigNumberInput
  currency_code: string
}
