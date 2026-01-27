import { DeleteResponse, PaginatedResponse } from "@medusajs/types"
import { OrderGroupDTO } from "../order-group"

export interface VendorOrderGroupResponse {
  /**
   * The order group's details.
   */
  order_group: OrderGroupDTO
}

export type VendorOrderGroupListResponse = PaginatedResponse<{
  /**
   * The list of order groups.
   */
  order_groups: OrderGroupDTO[]
}>

export type VendorOrderGroupDeleteResponse = DeleteResponse<"order_group">

export interface AdminOrderGroupResponse {
  /**
   * The order group's details.
   */
  order_group: OrderGroupDTO
}

export type AdminOrderGroupListResponse = PaginatedResponse<{
  /**
   * The list of order groups.
   */
  order_groups: OrderGroupDTO[]
}>

export type AdminOrderGroupDeleteResponse = DeleteResponse<"order_group">

export interface StoreOrderGroupResponse {
  /**
   * The order group's details.
   */
  order_group: OrderGroupDTO
}

export type StoreOrderGroupListResponse = PaginatedResponse<{
  /**
   * The list of order groups.
   */
  order_groups: OrderGroupDTO[]
}>

export type StoreCompleteCartResponse =
  | {
      type: "order_group"
      order_group: OrderGroupDTO
    }
  | {
      type: "cart"
      cart: any
      error: {
        message: string
        name: string
        type: string
      }
    }
