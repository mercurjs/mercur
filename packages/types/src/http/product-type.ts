import { PaginatedResponse, ProductTypeDTO } from "@medusajs/types"

export interface VendorProductTypeResponse {
  /**
   * The product type's details.
   */
  product_type: ProductTypeDTO
}

export type VendorProductTypeListResponse = PaginatedResponse<{
  /**
   * The list of product types.
   */
  product_types: ProductTypeDTO[]
}>
