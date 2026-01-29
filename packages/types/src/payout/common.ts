import { BigNumberInput } from "@medusajs/framework/types"

export enum PayoutAccountStatus {
  /**
   * User hasn't completed setup
   */
  PENDING = "pending",

  /**
   * Account is active
   */
  ACTIVE = "active",

  /**
   * Missing info or compliance issue
   */
  RESTRICTED = "restricted",

  /**
   * Permanently disabled
   */
  REJECTED = "rejected",
}

export enum PayoutStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  PAID = "paid",
  FAILED = "failed",
  CANCELED = "canceled",
}


export type PayoutWebhookAction =
  | "not_supported"
  | "account.activated"
  | "account.restricted"
  | "account.rejected"
  | "payout.processing"
  | "payout.paid"
  | "payout.failed"
  | "payout.canceled"


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
