import { PayoutAccountStatus, PayoutStatus } from "./common"
import { PayoutProviderInput } from "./provider"

export interface CreatePayoutAccountDTO extends PayoutProviderInput {
}

export interface CreateOnboardingDTO extends PayoutProviderInput {
  account_id: string
}

export interface CreatePayoutDTO extends PayoutProviderInput {
  account_id: string
  amount: number
  currency_code: string
}

export interface CreatePayoutReversalDTO extends PayoutProviderInput {
  account_id: string
  amount: number
  currency_code: string
}

export interface UpdatePayoutAccountDTO {
  id: string
  status: PayoutAccountStatus
}

export interface UpdatePayoutDTO {
  id: string
  status: PayoutStatus
}
