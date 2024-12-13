import { OnboardingDTO } from './common'

export interface CreatePayoutAccountDTO {
  context: Record<string, unknown>
}

export interface CreateOnboardingDTO
  extends Omit<
    Partial<OnboardingDTO>,
    'id' | 'created_at' | 'updated_at' | 'data'
  > {
  payout_account_id: string
  context: Record<string, unknown>
}
