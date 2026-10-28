import { BigNumberInput, ModuleProviderExports } from "@medusajs/types"

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

export enum PayoutKycStatus {
  PENDING_SUBMISSION = "pending_submission",
  PENDING_APPROVAL = "pending_approval",
  APPROVED = "approved",
  REFUSED = "refused",
}

export enum PayoutStatus {
  PENDING = "pending",
  ON_HOLD = "on_hold",
  PROCESSING = "processing",
  PAID = "paid",
  FAILED = "failed",
  ABORTED = "aborted",
}

export const PayoutModuleEvents = {
  ACCOUNT_UPDATED: "payout_account.updated",
  PAYOUT_FAILED: "payout.failed",
  PAYOUT_REVERSAL_FAILED: "payout.reversal_failed",
  WEBHOOK_RECEIVED: "payout.webhook_received",
} as const

export interface PayoutModuleOptions {
  providers?: {
    resolve: string | ModuleProviderExports
    id: string
    options?: Record<string, unknown>
  }[]

  onboarding?: {
    returnUrl?: string
    refreshBaseUrl?: string
    prefill?: boolean
    defaultCountry?: string
    /**
     * How long the token in an onboarding refresh URL stays valid, in seconds.
     * Defaults to 24 hours.
     */
    tokenTtlSeconds?: number
  }
}

export type ResolvedPayoutModuleOptions = {
  onboarding: {
    returnUrl: string
    refreshBaseUrl: string
    prefill: boolean
    defaultCountry?: string
    tokenTtlSeconds: number
  }
}

export function resolvePayoutModuleOptions(
  options?: PayoutModuleOptions | null
): ResolvedPayoutModuleOptions {
  return {
    onboarding: {
      returnUrl: "",
      refreshBaseUrl: "",
      prefill: false,
      tokenTtlSeconds: 24 * 60 * 60,
      ...(options?.onboarding ?? {}),
    },
  }
}

export type PayoutWebhookAction =
  | "not_supported"
  | "account.updated"
  | "account.activated"
  | "account.restricted"
  | "account.rejected"
  | "payout.paid"
  | "payout.failed"
  | "payout.reversed"

export interface PayoutAccountRequirements {
  currently_due: string[]
  past_due: string[]
  pending_verification: string[]
}

export interface PayoutAccountDTO {
  id: string
  external_id: string | null
  status: PayoutAccountStatus
  kyc_status: PayoutKycStatus | null
  payouts_enabled: boolean
  charges_enabled: boolean
  details_submitted: boolean
  disabled_reason: string | null
  onboarding_token: string | null
  onboarding_token_issued_at: Date | null
  last_synced_at: Date | null
  data: Record<string, unknown>
  context: Record<string, unknown> | null
  onboarding?: OnboardingDTO | null
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
  display_id: number
  account_id: string
  order_id: string | null
  amount: BigNumberInput
  currency_code: string
  status: PayoutStatus
  status_reason: string | null
  data: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  account?: PayoutAccountDTO
  reversals?: PayoutReversalDTO[]
  created_at: Date
  updated_at: Date
}

export interface PayoutReversalDTO {
  id: string
  payout_id: string
  refund_id: string | null
  amount: BigNumberInput
  status: PayoutStatus
  status_reason: string | null
  data: Record<string, unknown> | null
  payout?: PayoutDTO
  created_at: Date
  updated_at: Date
}

/**
 * Stable codes stored in `status_reason` on payouts and payout reversals.
 * Ids, statuses and provider messages behind a code go in `data.status_detail`.
 */
export const PayoutStatusReason = {
  ACCOUNT_NOT_READY: "account_not_ready",
  ACCOUNT_PAYOUTS_DISABLED: "account_payouts_disabled",
  ORDER_NOT_READY: "order_not_ready",
  ORDER_ABORTED: "order_aborted",
  PAYMENT_NOT_READY: "payment_not_ready",
  PAYMENT_FAILED: "payment_failed",
  PAYMENT_CANCELED: "payment_canceled",
  PAYMENT_REFUNDED: "payment_refunded",
  PAYOUT_NOT_READY: "payout_not_ready",
  REFUND_ABORTED: "refund_aborted",
  REFUND_ABSORBED: "refund_absorbed",
  INVALID_AMOUNT: "invalid_amount",
  PROVIDER_ERROR: "provider_error",
} as const

export type PayoutStatusReasonCode = (typeof PayoutStatusReason)[keyof typeof PayoutStatusReason]
