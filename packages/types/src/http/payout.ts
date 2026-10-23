import { BigNumberInput, PaginatedResponse } from "@medusajs/types"
import {
  AdjustmentDTO,
  OnboardingDTO,
  PayoutAccountDTO,
  PayoutDTO,
  PayoutJobName,
  PayoutJobRunDTO,
  PayoutProviderDTO,
  SettlementDTO,
  TransferDTO,
} from "../payout"

export interface VendorPayoutAccountResponse {
  payout_account: PayoutAccountDTO
}

export type VendorPayoutAccountListResponse = PaginatedResponse<{
  payout_accounts: PayoutAccountDTO[]
}>

export interface VendorOnboardingResponse {
  onboarding: OnboardingDTO
}

export interface VendorPayoutResponse {
  payout: PayoutDTO
}

export type VendorPayoutListResponse = PaginatedResponse<{
  payouts: PayoutDTO[]
}>

export interface VendorPayoutAccountMeResponse {
  payout_account: (PayoutAccountDTO & { onboarding: OnboardingDTO | null }) | null
}

export type VendorTransferListResponse = PaginatedResponse<{
  transfers: TransferDTO[]
}>

export type VendorSettlementListResponse = PaginatedResponse<{
  settlements: SettlementListItem[]
}>

export interface VendorSettlementResponse {
  settlement: SettlementDetail
}

export interface AdminPayoutResponse {
  payout: PayoutDTO
}

export type AdminPayoutListResponse = PaginatedResponse<{
  payouts: PayoutDTO[]
}>

export interface AdminPayoutAccountResponse {
  payout_account: PayoutAccountDTO
}

export type AdminPayoutAccountListResponse = PaginatedResponse<{
  payout_accounts: PayoutAccountDTO[]
}>

export interface AdminPayoutProviderListResponse {
  payout_providers: PayoutProviderDTO[]
}

export interface AdminTransferResponse {
  transfer: TransferDTO
}

export type AdminTransferListResponse = PaginatedResponse<{
  transfers: TransferDTO[]
}>

export interface SettlementSeller {
  id: string
  name: string
  handle: string
}

export interface SettlementPayoutSummary {
  id: string
  display_id: number
  status: string
  status_reason: string | null
  provider_payout_id: string | null
  created_at: Date
}

export interface SettlementListItem extends SettlementDTO {
  seller: SettlementSeller | null
  transfer_count: number
  reversal_count: number
  adjustment_count: number
  payout: SettlementPayoutSummary | null
}

export interface SettlementLine {
  id: string
  type: string
  order_id: string | null
  order_display_id: number | null
  reverses_transfer_id: string | null
  refund_id: string | null
  adjustment_id: string | null
  amount: BigNumberInput
  status: string
  provider_transfer_id: string | null
  source_created_at: Date | null
}

export interface SettlementAdjustmentLine {
  id: string
  type: string
  amount: BigNumberInput
  reason: string | null
  created_by: string | null
  transfer_id: string | null
  transfer_status: string | null
}

export interface SettlementDetail extends SettlementListItem {
  transfers: SettlementLine[]
  reversals: SettlementLine[]
  adjustments: SettlementAdjustmentLine[]
}

export type AdminSettlementListResponse = PaginatedResponse<{
  settlements: SettlementListItem[]
}>

export interface AdminSettlementResponse {
  settlement: SettlementDetail
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
  last_run: PayoutJobRunDTO | null
  next_run_at: Date | null
  failed_count: number
}

export interface AdminPayoutJobListResponse {
  jobs: AdminPayoutJob[]
}

export type AdminPayoutJobRunListResponse = PaginatedResponse<{
  runs: PayoutJobRunDTO[]
}>

export interface AdminPayoutJobRunResponse {
  run: PayoutJobRunDTO
}

export interface AdminPayoutStatusResponse {
  providers: PayoutProviderDTO[]
  options: Record<string, unknown>
  checkpoints: Record<string, string | null>
  failed: {
    captures: number
    transfers: number
    reversals: number
    payouts: number
  }
  last_webhook_at: Date | null
  jobs: AdminPayoutJob[]
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
  authorized_at: Date | null
  expires_at: Date | null
  capture_error: string | null
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
