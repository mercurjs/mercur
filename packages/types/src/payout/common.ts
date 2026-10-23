import { BigNumberInput, FulfillmentStatus, ModuleProviderExports } from "@medusajs/types"

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
  PROCESSING = "processing",
  PAID = "paid",
  FAILED = "failed",
  CANCELED = "canceled",
  ON_HOLD = "on_hold",
  ABORTED = "aborted",
}

export enum TransferStatus {
  PENDING = "pending",
  CREATED = "created",
  FAILED = "failed",
  ON_HOLD = "on_hold",
  ABORTED = "aborted",
  IGNORED = "ignored",
}

export enum TransferType {
  ORDER = "order",
  TAX = "tax",
  REFUND_REVERSAL = "refund_reversal",
  ADJUSTMENT_CREDIT = "adjustment_credit",
  ADJUSTMENT_DEBIT = "adjustment_debit",
}

export enum SettlementStatus {
  OPEN = "open",
  PAID_OUT = "paid_out",
  FAILED = "failed",
  ABORTED = "aborted",
}

export enum AdjustmentType {
  SUBSCRIPTION = "subscription",
  EXTRA_INVOICE = "extra_invoice",
  EXTRA_CREDIT = "extra_credit",
}

export enum PayoutJobRunStatus {
  RUNNING = "running",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
}

export enum PayoutJobTrigger {
  SCHEDULE = "schedule",
  MANUAL = "manual",
  SUBSCRIBER = "subscriber",
}

export const PAYOUT_JOBS = [
  "payout-sync-onboarding",
  "payout-validate-captures",
  "payout-process-transfers",
  "payout-process-reversals",
  "payout-process-settlements",
  "payout-alert-failed-operations",
  "payout-monitor-kyc",
] as const

export type PayoutJobName = (typeof PAYOUT_JOBS)[number]

export const PAYOUT_JOB_SCHEDULES: Record<PayoutJobName, string> = {
  "payout-sync-onboarding": "* * * * *",
  "payout-validate-captures": "0-59/5 * * * *",
  "payout-process-transfers": "1-59/5 * * * *",
  "payout-process-reversals": "2-59/5 * * * *",
  "payout-process-settlements": "3 1 * * *",
  "payout-alert-failed-operations": "4 8 * * *",
  "payout-monitor-kyc": "0 */6 * * *",
}

export const PayoutModuleEvents = {
  ACCOUNT_UPDATED: "payout_account.updated",
  TRANSFER_FAILED: "transfer.failed",
  TRANSFER_REVERSAL_FAILED: "transfer.reversal_failed",
  PAYOUT_FAILED: "payout.failed",
  SETTLEMENT_CREATED: "payout.settlement_created",
  WEBHOOK_RECEIVED: "payout.webhook_received",
} as const

export interface PayoutModuleOptions {
  providers?: {
    resolve: string | ModuleProviderExports
    id: string
    options?: Record<string, unknown>
  }[]

  onboarding?: {
    enabled?: boolean
    returnUrl?: string
    refreshBaseUrl?: string
    prefill?: boolean
    defaultCountry?: string
  }

  capture?: {
    captureBeforeAcceptance?: boolean
    authorizationWindowMs?: number
    safetyBufferMs?: number
  }

  transfers?: {
    enabled?: boolean
    requiredFulfillmentStatus?: FulfillmentStatus
    taxSplit?: { accountId: string }
  }

  reversals?: {
    enabled?: boolean
  }

  settlements?: {
    enabled?: boolean
    mode?: "connector" | "provider"
  }

  notifications?: {
    url?: string
    mailOnEndpointDown?: boolean
    endpointDownCooldownMinutes?: number
  }

  alerting?: {
    technicalEmail?: string
    from?: string
  }

  kycMonitor?: {
    enabled?: boolean
  }

  webhookDelay?: number
  webhookRetries?: number
}

export type ResolvedPayoutModuleOptions = {
  onboarding: {
    enabled: boolean
    returnUrl: string
    refreshBaseUrl: string
    prefill: boolean
    defaultCountry?: string
  }
  capture: {
    captureBeforeAcceptance: boolean
    authorizationWindowMs: number
    safetyBufferMs: number
  }
  transfers: {
    enabled: boolean
    requiredFulfillmentStatus: FulfillmentStatus
    taxSplit?: { accountId: string }
  }
  reversals: { enabled: boolean }
  settlements: { enabled: boolean; mode: "connector" | "provider" }
  notifications: {
    url?: string
    mailOnEndpointDown: boolean
    endpointDownCooldownMinutes: number
  }
  alerting: { technicalEmail?: string; from?: string }
  kycMonitor: { enabled: boolean }
  webhookDelay: number
  webhookRetries: number
}

export const PAYOUT_MODULE_OPTION_DEFAULTS: ResolvedPayoutModuleOptions = {
  onboarding: {
    enabled: true,
    returnUrl: "",
    refreshBaseUrl: "",
    prefill: false,
  },
  capture: {
    captureBeforeAcceptance: false,
    authorizationWindowMs: 7 * 24 * 60 * 60 * 1000,
    safetyBufferMs: 24 * 60 * 60 * 1000,
  },
  transfers: {
    enabled: true,
    requiredFulfillmentStatus: "fulfilled",
  },
  reversals: { enabled: true },
  settlements: { enabled: true, mode: "connector" },
  notifications: {
    mailOnEndpointDown: true,
    endpointDownCooldownMinutes: 10,
  },
  alerting: {},
  kycMonitor: { enabled: false },
  webhookDelay: 5000,
  webhookRetries: 3,
}

export function resolvePayoutModuleOptions(
  options?: PayoutModuleOptions | null
): ResolvedPayoutModuleOptions {
  const d = PAYOUT_MODULE_OPTION_DEFAULTS
  const o = options ?? {}
  return {
    onboarding: { ...d.onboarding, ...(o.onboarding ?? {}) },
    capture: { ...d.capture, ...(o.capture ?? {}) },
    transfers: { ...d.transfers, ...(o.transfers ?? {}) },
    reversals: { ...d.reversals, ...(o.reversals ?? {}) },
    settlements: { ...d.settlements, ...(o.settlements ?? {}) },
    notifications: { ...d.notifications, ...(o.notifications ?? {}) },
    alerting: { ...d.alerting, ...(o.alerting ?? {}) },
    kycMonitor: { ...d.kycMonitor, ...(o.kycMonitor ?? {}) },
    webhookDelay: o.webhookDelay ?? d.webhookDelay,
    webhookRetries: o.webhookRetries ?? d.webhookRetries,
  }
}

export type PayoutWebhookAction =
  | "not_supported"
  | "account.updated"
  | "account.activated"
  | "account.restricted"
  | "account.rejected"
  | "transfer.created"
  | "transfer.failed"
  | "transfer.reversed"
  | "payout.processing"
  | "payout.paid"
  | "payout.failed"
  | "payout.canceled"

export interface PayoutAccountRequirements {
  currently_due: string[]
  past_due: string[]
  pending_verification: string[]
}

export interface PayoutProviderDTO {
  id: string
  is_enabled: boolean
}

export interface PayoutAccountDTO {
  id: string
  provider_id: string
  provider_account_id: string | null
  status: PayoutAccountStatus
  kyc_status: PayoutKycStatus | null
  payouts_enabled: boolean
  charges_enabled: boolean
  details_submitted: boolean
  disabled_reason: string | null
  requirements: PayoutAccountRequirements | null
  ignored: boolean
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
  settlement_id: string | null
  provider_payout_id: string | null
  amount: BigNumberInput
  currency_code: string
  status: PayoutStatus
  status_reason: string | null
  data: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

export interface TransferDTO {
  id: string
  account_id: string
  provider_id: string
  type: TransferType
  order_id: string | null
  adjustment_id: string | null
  reverses_transfer_id: string | null
  refund_id: string | null
  source_payment_id: string | null
  provider_transfer_id: string | null
  amount: BigNumberInput
  currency_code: string
  status: TransferStatus
  status_reason: string | null
  source_created_at: Date | null
  settlement_id: string | null
  data: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

export interface SettlementDTO {
  id: string
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
  created_at: Date
  updated_at: Date
}

export interface AdjustmentDTO {
  id: string
  account_id: string
  type: AdjustmentType
  amount: BigNumberInput
  currency_code: string
  reason: string | null
  created_by: string | null
  transfer_id: string | null
  created_at: Date
  updated_at: Date
}

export interface PayoutJobRunDTO {
  id: string
  job: string
  trigger: PayoutJobTrigger
  status: PayoutJobRunStatus
  started_at: Date
  finished_at: Date | null
  stats: Record<string, unknown> | null
  error: string | null
}

export const PayoutStatusReason = {
  ACCOUNT_NOT_READY: "Cannot find payout account for seller %s",
  ACCOUNT_PAYOUTS_DISABLED: "Payouts are disabled for seller %s",
  ACCOUNT_IGNORED: "Seller %s is ignored",
  ORDER_NOT_READY: "Order is not ready yet, status is %s",
  ORDER_ABORTED: "Order cannot be processed, status is %s",
  PAYMENT_NOT_READY: "Payment %s is not ready yet, status is %s",
  PAYMENT_FAILED: "Payment %s failed",
  PAYMENT_CANCELED: "Payment %s has been canceled",
  PAYMENT_REFUNDED: "Payment %s has been fully refunded",
  TRANSFER_NOT_READY: "Payment split has to occur before the transfer can be reversed for a refund",
  REFUND_ABORTED: "Refund %s has been aborted",
  INVALID_AMOUNT: "Amount must be positive, input was: %s",
  SOURCE_PAYMENT_UNSUPPORTED: "Provider cannot use payment %s as a transfer source",
  AUTHORIZATION_EXPIRED: "Payment authorization expired",
} as const

export function formatStatusReason(template: string, ...values: unknown[]): string {
  let i = 0
  return template.replace(/%s/g, () => String(values[i++] ?? ""))
}
