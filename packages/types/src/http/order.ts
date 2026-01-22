import { OrderDTO, PaginatedResponse } from "@medusajs/types"

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
