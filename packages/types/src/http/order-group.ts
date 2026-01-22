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
