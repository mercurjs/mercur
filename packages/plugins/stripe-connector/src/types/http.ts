import type { BigNumberInput, PaginatedResponse } from "@medusajs/types"
import type { HttpTypes } from "@mercurjs/types"

import type { AdjustmentDTO, JobRunDTO, PayoutJobName, SettlementDTO } from "./common"

export type AdminPayoutAccountListResponse = HttpTypes.AdminPayoutAccountListResponse
export type AdminPayoutAccountResponse = HttpTypes.AdminPayoutAccountResponse
export type AdminPayoutListResponse = HttpTypes.AdminPayoutListResponse
export type AdminPayoutResponse = HttpTypes.AdminPayoutResponse
export type VendorPayoutAccountMeResponse = HttpTypes.VendorPayoutAccountMeResponse
export type VendorPayoutListResponse = HttpTypes.VendorPayoutListResponse

export interface SettlementSeller {
  id: string
  name: string
  handle: string
}

export interface SettlementListItem extends SettlementDTO {
  seller: SettlementSeller | null
  payout_count: number
  reversal_count: number
  adjustment_count: number
}

export interface SettlementLine {
  id: string
  type: string
  source_id: string
  order_id: string | null
  order_display_id: number | null
  refund_id: string | null
  amount: BigNumberInput
  status: string | null
  provider_id: string | null
}

export interface SettlementAdjustmentLine {
  id: string
  type: string
  amount: BigNumberInput
  reason: string | null
  created_by: string | null
  status: string
  provider_transfer_id: string | null
}

export interface SettlementDetail extends SettlementListItem {
  payouts: SettlementLine[]
  reversals: SettlementLine[]
  adjustments: SettlementAdjustmentLine[]
}

export type AdminSettlementListResponse = PaginatedResponse<{
  settlements: SettlementListItem[]
}>

export interface AdminSettlementResponse {
  settlement: SettlementDetail
}

export type VendorSettlementListResponse = AdminSettlementListResponse
export type VendorSettlementResponse = AdminSettlementResponse

export interface AdminAdjustmentResponse {
  adjustment: AdjustmentDTO
}

export type AdminAdjustmentListResponse = PaginatedResponse<{
  adjustments: AdjustmentDTO[]
}>

export interface AdminPayoutJob {
  job: PayoutJobName
  schedule: string
  enabled: boolean
  checkpoint: string | null
  last_run: JobRunDTO | null
  next_run_at: Date | null
  failed_count: number
}

export interface AdminPayoutJobListResponse {
  jobs: AdminPayoutJob[]
}

export type AdminPayoutJobRunListResponse = PaginatedResponse<{
  runs: JobRunDTO[]
}>

export interface AdminPayoutJobRunResponse {
  run: JobRunDTO
}

export interface AdminPayoutStatusResponse {
  configured: boolean
  options: Record<string, unknown>
  checkpoints: Record<string, string | null>
  failed: {
    captures: number
    payouts: number
    reversals: number
    settlements: number
    adjustments: number
  }
  last_webhook_at: Date | null
  jobs: AdminPayoutJob[]
}

export interface AdminPayoutCaptureOrder {
  id: string
  display_id: number | null
  status: string
  canceled_at: Date | string | null
  fulfillment_status: string | null
  total: BigNumberInput
  currency_code: string | null
  seller: { id: string; name: string | null } | null
}

export interface AdminPayoutCapture {
  order_group_id: string
  order_group_display_id: number | null
  payment_collection_id: string
  payment_id: string
  provider_id: string
  currency_code: string
  authorized_amount: BigNumberInput
  capturable_amount: BigNumberInput
  orders_total: number
  orders_decided: number
  decided: boolean
  action: "wait" | "capture" | "cancel" | "expired"
  authorized_at: Date | null
  expires_at: Date | null
  capture_error: string | null
  orders: AdminPayoutCaptureOrder[]
}

export type AdminPayoutCaptureResponse = {
  capture: AdminPayoutCapture
}

export type AdminPayoutCaptureListResponse = PaginatedResponse<{
  captures: AdminPayoutCapture[]
}>

export interface AdminPayoutNotification {
  id: string
  type: string
  url: string
  attempts: number
  response_status: number | null
  error: string | null
  delivered: boolean
  created_at: Date
}

export type AdminPayoutNotificationListResponse = PaginatedResponse<{
  notifications: AdminPayoutNotification[]
}>
