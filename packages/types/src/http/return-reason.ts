import { PaginatedResponse, ReturnReasonDTO } from "@medusajs/types"

export interface VendorReturnReasonResponse {
  /**
   * The return reason's details.
   */
  return_reason: ReturnReasonDTO
}

export type VendorReturnReasonListResponse = PaginatedResponse<{
  /**
   * The list of return reasons.
   */
  return_reasons: ReturnReasonDTO[]
}>
