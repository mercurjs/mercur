import {
  DeleteResponse,
  OrderDTO,
  OrderPreviewDTO,
  PaginatedResponse,
  ReturnDTO,
} from "@medusajs/types"

export interface VendorReturnResponse {
  /**
   * The return's details.
   */
  return: ReturnDTO
}

export type VendorReturnListResponse = PaginatedResponse<{
  /**
   * The list of returns.
   */
  returns: ReturnDTO[]
}>

export interface VendorOrderReturnResponse {
  /**
   * The order's details.
   */
  order: OrderDTO
  /**
   * The return's details.
   */
  return: ReturnDTO
}

export interface VendorReturnPreviewResponse {
  /**
   * The order preview.
   */
  order_preview: OrderPreviewDTO
  /**
   * The return's details.
   */
  return: ReturnDTO
}

export type VendorReturnDeleteResponse = DeleteResponse<"return">
