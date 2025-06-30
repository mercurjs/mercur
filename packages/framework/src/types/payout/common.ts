/* Payment Account */
import { BigNumberInput } from '@medusajs/framework/types'

export enum PayoutAccountStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  DISABLED = 'disabled'
}

export type PayoutAccountDTO = {
  id: string
  created_at: Date
  updated_at: Date
  reference_id: string
  data: Record<string, unknown>
  status: PayoutAccountStatus
}

/* Onboarding */

export type OnboardingDTO = {
  id: string
  created_at: Date
  updated_at: Date
  data: Record<string, unknown>
  context: Record<string, unknown>
}

/* Payout */

export type PayoutDTO = {
  id: string
  created_at: Date
  updated_at: Date
  data: Record<string, unknown> | null
  amount: BigNumberInput
  currency_code: string
}
