import type { BigNumberInput, FulfillmentStatus } from "@medusajs/framework/types"
import type { PayoutStatus } from "@mercurjs/types"

export const STRIPE_CONNECTOR_MODULE = "stripe_connector"

export enum SettlementStatus {
  OPEN = "open",
  PAID_OUT = "paid_out",
  FAILED = "failed",
  ABORTED = "aborted",
}

export enum SettlementLineType {
  PAYOUT = "payout",
  REVERSAL = "reversal",
  ADJUSTMENT_CREDIT = "adjustment_credit",
  ADJUSTMENT_DEBIT = "adjustment_debit",
}

export enum AdjustmentType {
  SUBSCRIPTION = "subscription",
  EXTRA_INVOICE = "extra_invoice",
  EXTRA_CREDIT = "extra_credit",
}

export enum JobRunStatus {
  RUNNING = "running",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
}

export enum JobTrigger {
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

export const StripeConnectorEvents = {
  SETTLEMENT_CREATED: "stripe_connector.settlement_created",
} as const

export const PAYOUT_IGNORED_KEY = "payout_ignored"

export enum CaptureStatus {
  /** Some orders of the group are not decided yet. */
  PENDING = "pending",
  /** Every order is decided, or the authorization is about to expire: capture now. */
  READY = "ready",
  /** Every order was canceled: release the authorization. */
  CANCELABLE = "cancelable",
  CAPTURED = "captured",
  CANCELED = "canceled",
  EXPIRED = "expired",
  FAILED = "failed",
}

export const OPEN_CAPTURE_STATUSES = [
  CaptureStatus.PENDING,
  CaptureStatus.READY,
  CaptureStatus.CANCELABLE,
  CaptureStatus.FAILED,
]

export interface StripeConnectorPluginOptions {
  /** Platform secret key, used for settlement bank payouts and adjustments. */
  apiKey?: string
  /** Signing secret of the Connect webhook endpoint (`/hooks/payout`). */
  webhookSecret?: string
  onboarding?: { enabled?: boolean }
  capture?: {
    captureBeforeAcceptance?: boolean
    authorizationWindowMs?: number
    safetyBufferMs?: number
  }
  transfers?: {
    enabled?: boolean
    requiredFulfillmentStatus?: FulfillmentStatus
  }
  reversals?: { enabled?: boolean }
  settlements?: {
    enabled?: boolean
    /**
     * `connector` nets each window and sends the bank payout itself (connected
     * accounts on a manual payout schedule); `provider` leaves bank payouts to
     * Stripe's automatic schedule and only records the settlement.
     */
    mode?: "connector" | "provider"
  }
  notifications?: {
    url?: string
    mailOnEndpointDown?: boolean
    endpointDownCooldownMinutes?: number
  }
  alerting?: { technicalEmail?: string; from?: string }
  kycMonitor?: { enabled?: boolean }
}

export type ResolvedStripeConnectorOptions = {
  apiKey?: string
  webhookSecret?: string
  onboarding: { enabled: boolean }
  capture: {
    captureBeforeAcceptance: boolean
    authorizationWindowMs: number
    safetyBufferMs: number
  }
  transfers: { enabled: boolean; requiredFulfillmentStatus: FulfillmentStatus }
  reversals: { enabled: boolean }
  settlements: { enabled: boolean; mode: "connector" | "provider" }
  notifications: {
    url?: string
    mailOnEndpointDown: boolean
    endpointDownCooldownMinutes: number
  }
  alerting: { technicalEmail?: string; from?: string }
  kycMonitor: { enabled: boolean }
}

export function resolveStripeConnectorOptions(
  options?: StripeConnectorPluginOptions | null
): ResolvedStripeConnectorOptions {
  const o = options ?? {}
  return {
    apiKey: o.apiKey,
    webhookSecret: o.webhookSecret,
    onboarding: { enabled: true, ...(o.onboarding ?? {}) },
    capture: {
      captureBeforeAcceptance: false,
      authorizationWindowMs: 7 * 24 * 60 * 60 * 1000,
      safetyBufferMs: 24 * 60 * 60 * 1000,
      ...(o.capture ?? {}),
    },
    transfers: { enabled: true, requiredFulfillmentStatus: "fulfilled", ...(o.transfers ?? {}) },
    reversals: { enabled: true, ...(o.reversals ?? {}) },
    settlements: { enabled: true, mode: "connector", ...(o.settlements ?? {}) },
    notifications: {
      mailOnEndpointDown: true,
      endpointDownCooldownMinutes: 10,
      ...(o.notifications ?? {}),
    },
    alerting: { ...(o.alerting ?? {}) },
    kycMonitor: { enabled: false, ...(o.kycMonitor ?? {}) },
  }
}

export interface SettlementDTO {
  id: string
  display_id: number
  account_id: string
  currency_code: string
  period_start: Date
  period_end: Date
  payouts_total: BigNumberInput
  reversals_total: BigNumberInput
  adjustments_total: BigNumberInput
  amount: BigNumberInput
  status: SettlementStatus
  payout_status: PayoutStatus | null
  provider_payout_id: string | null
  status_reason: string | null
  data: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

export interface SettlementLineDTO {
  id: string
  settlement_id: string
  type: SettlementLineType
  payout_id: string | null
  payout_reversal_id: string | null
  adjustment_id: string | null
  amount: BigNumberInput
  created_at: Date
}

export interface CaptureDTO {
  id: string
  order_group_id: string
  payment_collection_id: string
  payment_id: string
  currency_code: string
  authorized_amount: BigNumberInput
  capturable_amount: BigNumberInput
  orders_total: number
  orders_decided: number
  status: CaptureStatus
  status_reason: string | null
  authorized_at: Date | null
  expires_at: Date | null
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
  status: PayoutStatus
  status_reason: string | null
  provider_transfer_id: string | null
  data: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

export interface JobRunDTO {
  id: string
  job: string
  trigger: JobTrigger
  status: JobRunStatus
  started_at: Date
  finished_at: Date | null
  stats: Record<string, unknown> | null
  error: string | null
}

export interface ConnectorNotificationDTO {
  id: string
  type: string
  url: string
  payload: Record<string, unknown>
  attempts: number
  response_status: number | null
  error: string | null
  delivered: boolean
  created_at: Date
}
