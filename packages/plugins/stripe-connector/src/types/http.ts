import type { BigNumberInput, PaginatedResponse } from "@medusajs/types"
import type { HttpTypes, PayoutStatus } from "@mercurjs/types"

import type {
  AdjustmentDTO,
  AdjustmentType,
  CaptureDTO,
  JobRunDTO,
  PayoutJobName,
  SettlementDTO,
  SettlementLineType,
} from "./common"

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

type SettlementOrderRef = { order_id: string | null; order?: { display_id: number } | null }

export interface SettlementLineDetail {
  id: string
  type: SettlementLineType
  amount: BigNumberInput
  payout_id: string | null
  payout_reversal_id: string | null
  adjustment_id: string | null
  payout?: (SettlementOrderRef & { id: string; status: PayoutStatus; data: Record<string, unknown> | null }) | null
  payout_reversal?: {
    id: string
    status: PayoutStatus
    refund_id: string | null
    data: Record<string, unknown> | null
    payout?: SettlementOrderRef | null
  } | null
  adjustment?: {
    id: string
    type: AdjustmentType
    amount: BigNumberInput
    reason: string | null
    created_by?: string | null
    status: PayoutStatus
    provider_transfer_id: string | null
  } | null
}

export interface AdminSettlement extends Omit<SettlementDTO, "data"> {
  data?: Record<string, unknown> | null
  payout_account?: { id: string; seller?: SettlementSeller | null } | null
  lines?: SettlementLineDetail[]
}

export type VendorSettlement = Omit<AdminSettlement, "account_id" | "data" | "payout_account">

export type AdminSettlementListResponse = PaginatedResponse<{
  settlements: AdminSettlement[]
}>

export interface AdminSettlementResponse {
  settlement: AdminSettlement
}

export type VendorSettlementListResponse = PaginatedResponse<{
  settlements: VendorSettlement[]
}>

export interface VendorSettlementResponse {
  settlement: VendorSettlement
}

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
