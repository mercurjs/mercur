import { BigNumberInput } from "@medusajs/types"
import {
  AdjustmentType,
  PayoutAccountRequirements,
  PayoutAccountStatus,
  PayoutJobName,
  PayoutJobTrigger,
  PayoutKycStatus,
  PayoutStatus,
  SettlementStatus,
  TransferStatus,
  TransferType,
} from "./common"
import { PayoutProviderInput } from "./provider"

export interface CreatePayoutAccountDTO extends PayoutProviderInput {
  provider_id?: string
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

export interface CreatePayoutDTO extends PayoutProviderInput {
  account_id: string
  amount: BigNumberInput
  currency_code: string
  settlement_id?: string | null
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
  ignored?: boolean
  onboarding_token?: string | null
  last_synced_at?: Date | null
  data?: Record<string, unknown>
}

export interface UpdatePayoutDTO {
  id: string
  status?: PayoutStatus
  status_reason?: string | null
  provider_payout_id?: string | null
  data?: Record<string, unknown> | null
}

export interface CreateTransferDTO {
  account_id: string
  provider_id: string
  type: TransferType
  amount: BigNumberInput
  currency_code: string
  status: TransferStatus
  status_reason?: string | null
  order_id?: string | null
  adjustment_id?: string | null
  reverses_transfer_id?: string | null
  refund_id?: string | null
  source_payment_id?: string | null
  source_created_at?: Date | null
  data?: Record<string, unknown> | null
}

export interface UpdateTransferDTO {
  id: string
  status?: TransferStatus
  status_reason?: string | null
  amount?: BigNumberInput
  account_id?: string
  source_payment_id?: string | null
  provider_transfer_id?: string | null
  settlement_id?: string | null
  data?: Record<string, unknown> | null
}

export interface CreateSettlementDTO {
  account_id: string
  provider_id: string
  currency_code: string
  period_start: Date
  period_end: Date
  transfers_total: BigNumberInput
  reversals_total: BigNumberInput
  adjustments_total: BigNumberInput
  amount: BigNumberInput
  status: SettlementStatus
}

export interface UpdateSettlementDTO {
  id: string
  status?: SettlementStatus
}

export interface CreatePayoutAdjustmentDTO {
  account_id: string
  type: AdjustmentType
  amount: BigNumberInput
  currency_code: string
  reason?: string | null
  created_by?: string | null
}

export interface CreatePayoutJobRunDTO {
  job: PayoutJobName
  trigger: PayoutJobTrigger
}
