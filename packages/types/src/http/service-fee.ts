import { DeleteResponse, PaginatedResponse } from "@medusajs/types"
import {
  ServiceFeeDTO,
  ServiceFeeRuleDTO,
  ServiceFeeChangeLogDTO,
} from "../service-fee"

export interface AdminServiceFeeResponse {
  service_fee: ServiceFeeDTO
}

export type AdminServiceFeeListResponse = PaginatedResponse<{
  service_fees: ServiceFeeDTO[]
}>

export type AdminServiceFeeDeleteResponse = DeleteResponse<"service_fee">

export interface AdminBatchServiceFeeRulesResponse {
  created: ServiceFeeRuleDTO[]
  updated: ServiceFeeRuleDTO[]
  deleted: string[]
}

export interface AdminServiceFeeChangeLogListResponse {
  change_logs: ServiceFeeChangeLogDTO[]
  count: number
  offset: number
  limit: number
}
