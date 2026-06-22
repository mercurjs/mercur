import {
  CustomerDTO,
  CustomerGroupDTO,
  PaginatedResponse,
} from "@medusajs/types"

export interface VendorCustomerResponse {
  /**
   * The customer's details.
   */
  customer: CustomerDTO
}

export type VendorCustomerListResponse = PaginatedResponse<{
  /**
   * The list of customers.
   */
  customers: CustomerDTO[]
}>

export interface VendorCustomerGroupResponse {
  /**
   * The customer group's details.
   */
  customer_group: CustomerGroupDTO
}

export type VendorCustomerGroupListResponse = PaginatedResponse<{
  /**
   * The list of customer groups.
   */
  customer_groups: CustomerGroupDTO[]
}>

export interface VendorCustomerGroupDeleteResponse {
  /**
   * The ID of the deleted customer group.
   */
  id: string
  /**
   * The type of the deleted object.
   */
  object: "customer_group"
  /**
   * Whether the customer group was deleted.
   */
  deleted: boolean
}
