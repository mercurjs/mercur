import { PaginatedResponse, ProductTagDTO } from "@medusajs/types"

export interface VendorProductTagResponse {
  /**
   * The product tag's details.
   */
  product_tag: ProductTagDTO
}

export type VendorProductTagListResponse = PaginatedResponse<{
  /**
   * The list of product tags.
   */
  product_tags: ProductTagDTO[]
}>
