import { BigNumberInput } from "@medusajs/types"
import {
  PayoutAccountRequirements,
  PayoutAccountStatus,
  PayoutKycStatus,
  PayoutStatus,
} from "./common"
import { PayoutProviderInput } from "./provider"

export interface CreatePayoutAccountDTO extends PayoutProviderInput {
  seller?: {
    id: string
    name?: string | null
    email?: string | null
    phone?: string | null
    website_url?: string | null
    country_code?: string | null
    is_company?: boolean
  }
}

export interface CreateOnboardingDTO extends PayoutProviderInput {
  account_id: string
}

export interface UpdatePayoutAccountDTO {
  id: string
  status?: PayoutAccountStatus
  kyc_status?: PayoutKycStatus | null
  payouts_enabled?: boolean
  charges_enabled?: boolean
  details_submitted?: boolean
  disabled_reason?: string | null
  requirements?: PayoutAccountRequirements | null
  onboarding_token?: string | null
  last_synced_at?: Date | null
  data?: Record<string, unknown>
}

export interface CreatePayoutDTO {
  account_id: string
  amount: BigNumberInput
  currency_code: string
  order_id?: string | null
  status?: PayoutStatus
  status_reason?: string | null
  data?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}

export interface UpdatePayoutDTO {
  id: string
  account_id?: string
  amount?: BigNumberInput
  status?: PayoutStatus
  status_reason?: string | null
  provider_payout_id?: string | null
  data?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}

export interface CreatePayoutReversalDTO {
  payout_id: string
  amount: BigNumberInput
  refund_id?: string | null
  status?: PayoutStatus
  status_reason?: string | null
  data?: Record<string, unknown> | null
}

export interface UpdatePayoutReversalDTO {
  id: string
  amount?: BigNumberInput
  status?: PayoutStatus
  status_reason?: string | null
  provider_reversal_id?: string | null
  data?: Record<string, unknown> | null
}
