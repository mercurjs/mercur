import { PaginatedResponse, ShippingOptionTypeDTO } from "@medusajs/types"

export interface VendorShippingOptionTypeResponse {
  /**
   * The shipping option type's details.
   */
  shipping_option_type: ShippingOptionTypeDTO
}

export type VendorShippingOptionTypeListResponse = PaginatedResponse<{
  /**
   * The list of shipping option types.
   */
  shipping_option_types: ShippingOptionTypeDTO[]
}>
