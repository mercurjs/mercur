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
  }
}

export type ResolvedPayoutModuleOptions = {
  onboarding: {
    returnUrl: string
    refreshBaseUrl: string
    prefill: boolean
    defaultCountry?: string
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
  provider_account_id: string | null
  status: PayoutAccountStatus
  kyc_status: PayoutKycStatus | null
  payouts_enabled: boolean
  charges_enabled: boolean
  details_submitted: boolean
  disabled_reason: string | null
  requirements: PayoutAccountRequirements | null
  onboarding_token: string | null
  last_synced_at: Date | null
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
  display_id: number
  account_id: string
  order_id: string | null
  provider_payout_id: string | null
  amount: BigNumberInput
  currency_code: string
  status: PayoutStatus
  status_reason: string | null
  data: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  reversals?: PayoutReversalDTO[]
  created_at: Date
  updated_at: Date
}

export interface PayoutReversalDTO {
  id: string
  payout_id: string
  refund_id: string | null
  provider_reversal_id: string | null
  amount: BigNumberInput
  status: PayoutStatus
  status_reason: string | null
  data: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

export const PayoutStatusReason = {
  ACCOUNT_NOT_READY: "Cannot find payout account for seller %s",
  ACCOUNT_PAYOUTS_DISABLED: "Payouts are disabled for seller %s",
  ORDER_NOT_READY: "Order is not ready yet, status is %s",
  ORDER_ABORTED: "Order cannot be processed, status is %s",
  PAYMENT_NOT_READY: "Payment %s is not ready yet, status is %s",
  PAYMENT_FAILED: "Payment %s failed",
  PAYMENT_CANCELED: "Payment %s has been canceled",
  PAYMENT_REFUNDED: "Payment %s has been fully refunded",
  PAYOUT_NOT_READY: "The payout has to be paid before it can be reversed for a refund",
  REFUND_ABORTED: "Refund %s has been aborted",
  REFUND_ABSORBED: "Refund %s was deducted from the payout",
  INVALID_AMOUNT: "Amount must be positive, input was: %s",
} as const

export function formatStatusReason(template: string, ...values: unknown[]): string {
  let i = 0
  return template.replace(/%s/g, () => String(values[i++] ?? ""))
}
