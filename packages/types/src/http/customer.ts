import { CustomerDTO, PaginatedResponse } from "@medusajs/types"

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
