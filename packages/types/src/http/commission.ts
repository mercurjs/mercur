import { DeleteResponse, PaginatedResponse } from "@medusajs/types"
import { CommissionRateDTO, CommissionRuleDTO } from "../commission"

export interface AdminCommissionRateResponse {
  commission_rate: CommissionRateDTO
}

export type AdminCommissionRateListResponse = PaginatedResponse<{
  commission_rates: CommissionRateDTO[]
}>

export type AdminCommissionRateDeleteResponse = DeleteResponse<"commission_rate">

export interface AdminBatchCommissionRulesResponse {
  created: CommissionRuleDTO[]
  updated: CommissionRuleDTO[]
  deleted: string[]
}
