import { BigNumberInput } from "@medusajs/framework/types"
import { PayoutProviderInput } from "./provider"

export enum PayoutAccountStatus {
  PENDING = "pending",
  ACTIVE = "active",
  SUSPENDED = "suspended",
  DISABLED = "disabled",
}

export enum PayoutWebhookAction {
  ACCOUNT_AUTHORIZED = "account_authorized",
  ACCOUNT_UPDATED = "account_updated",
  PAYOUT_CREATED = "payout_created",
  PAYOUT_COMPLETED = "payout_completed",
  PAYOUT_FAILED = "payout_failed",
  PAYOUT_REVERSED = "payout_reversed",
  NOT_SUPPORTED = "not_supported",
}

export enum PayoutStatus {
  PENDING = "pending",
  FINALIZED = "finalized",
  REVERSED = "reversed",
  FAILED = "failed",
  CANCELED = "canceled",
}


export interface PayoutAccountDTO {
  id: string
  status: PayoutAccountStatus
  data: Record<string, unknown>
  context: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

export interface OnboardingDTO {
  id: string
  account_id: string
  data: Record<string, unknown> | null
  context: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

export interface PayoutDTO {
  id: string
  account_id: string
  amount: BigNumberInput
  currency_code: string
  status: PayoutStatus
  data: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

export interface PayoutReversalDTO {
  id: string
  payout_id: string
  amount: BigNumberInput
  currency_code: string
  data: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

export interface CreatePayoutAccountDTO extends PayoutProviderInput {
}

export interface InitializeOnboardingDTO extends PayoutProviderInput {
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
