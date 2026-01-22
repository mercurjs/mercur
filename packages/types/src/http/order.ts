import {
  FulfillmentDTO,
  OrderChangeDTO,
  OrderDTO,
  OrderPreviewDTO,
  PaginatedResponse,
} from "@medusajs/types"

export interface VendorOrderResponse {
  /**
   * The order's details.
   */
  order: OrderDTO
}

export type VendorOrderListResponse = PaginatedResponse<{
  /**
   * The list of orders.
   */
  orders: OrderDTO[]
}>

export interface VendorOrderPreviewResponse {
  /**
   * The order preview details.
   */
  order: OrderPreviewDTO
}

export interface VendorOrderChangesResponse {
  /**
   * The list of order changes.
   */
  order_changes: OrderChangeDTO[]
}

export interface VendorFulfillmentResponse {
  /**
   * The fulfillment details.
   */
  fulfillment: FulfillmentDTO
}
