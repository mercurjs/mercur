import { PaginatedResponse } from "@medusajs/types"
import { OnboardingDTO, PayoutAccountDTO, PayoutDTO } from "../payout"

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
