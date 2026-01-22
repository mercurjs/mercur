import { PaginatedResponse, OrderReturnReasonDTO } from "@medusajs/types"

export interface VendorReturnReasonResponse {
  /**
   * The return reason's details.
   */
  return_reason: OrderReturnReasonDTO
}

export type VendorReturnReasonListResponse = PaginatedResponse<{
  /**
   * The list of return reasons.
   */
  return_reasons: OrderReturnReasonDTO[]
}>
