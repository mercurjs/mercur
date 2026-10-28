import type { BigNumberInput, PaginatedResponse } from "@medusajs/types"
import type { HttpTypes } from "@mercurjs/types"

import type { AdjustmentDTO, CaptureDTO, JobRunDTO, PayoutJobName, SettlementDTO } from "./common"

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

export interface AdminStripeCapture extends CaptureDTO {
  order_group: { id: string; display_id: number | null } | null
}

export type AdminStripeCaptureResponse = {
  capture: AdminStripeCapture
}

export type AdminStripeCaptureListResponse = PaginatedResponse<{
  captures: AdminStripeCapture[]
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
