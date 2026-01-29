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
