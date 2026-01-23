import { PaginatedResponse, RefundReasonDTO } from "@medusajs/types"

export interface VendorRefundReasonResponse {
  /**
   * The refund reason's details.
   */
  refund_reason: RefundReasonDTO
}

export type VendorRefundReasonListResponse = PaginatedResponse<{
  /**
   * The list of refund reasons.
   */
  refund_reasons: RefundReasonDTO[]
}>
