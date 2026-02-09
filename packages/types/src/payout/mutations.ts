import { PayoutAccountStatus, PayoutStatus } from "./common"
import { PayoutProviderInput } from "./provider"
import { BigNumberInput } from "@medusajs/types"

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

export interface UpdatePayoutAccountDTO {
  id: string
  status: PayoutAccountStatus
}

export interface UpdatePayoutDTO {
  id: string
  status: PayoutStatus
}

export interface CreatePayoutTransactionDTO {
  account_id: string
  amount: BigNumberInput
  currency_code: string
  reference?: string
  reference_id?: string
}

export interface CreatePayoutBalanceDTO {
  account_id: string
  currency_code: string
  totals?: Record<string, unknown>
}
