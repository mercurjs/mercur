import { BigNumberInput, FulfillmentStatus } from "@medusajs/types"

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

export enum PayoutEvents {
  // TODO: Move to order-related domain events
  OrderCaptureRequested = 'order.capture_requested',
  PayoutRequested = 'payout.requested',
}


export interface PayoutModuleOptions {
  /**
   * Disable automatic capture checks and daily payout jobs.
   * When true, both the capture-check and daily-payouts scheduled jobs
   * will exit immediately without processing any orders.
   * Default: false.
   */
  disabled?: boolean

  /**
   * How long a payment authorization remains valid before capture is no longer possible.
   * Default: 7 days.
   */
  authorizationWindowMs?: number

  /**
   * How long a seller has to complete required acceptance or fulfillment actions
   * before the order should be rejected or canceled.
   * Example: 72 hours.
   */
  sellerActionWindowMs?: number

  /**
   * Safety margin before authorization expiry. Capture should happen before:
   * authorization expiry - capture safety buffer.
   * Default: 24 hours.
   */
  captureSafetyBufferMs?: number

  /**
   * Minimum fulfillment status an order must have before it becomes eligible
   * for capture and payout. The check uses an ordered scale:
   *   not_fulfilled < partially_fulfilled < fulfilled < partially_shipped < shipped < partially_delivered < delivered
   * An order qualifies when its status is >= the configured requirement.
   * Default: "fulfilled".
   */
  requiredFulfillmentStatus?: FulfillmentStatus
}

export const PAYOUT_MODULE_OPTION_DEFAULTS: Required<PayoutModuleOptions> = {
  disabled: false,
  authorizationWindowMs: 7 * 24 * 60 * 60 * 1000,
  sellerActionWindowMs: 72 * 60 * 60 * 1000,
  captureSafetyBufferMs: 24 * 60 * 60 * 1000,
  requiredFulfillmentStatus: "fulfilled",
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
  display_id: number
  account_id: string
  amount: BigNumberInput
  currency_code: string
  status: PayoutStatus
  data: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

