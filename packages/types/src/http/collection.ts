import { PaginatedResponse, ProductCollectionDTO } from "@medusajs/types"

export interface VendorCollectionResponse {
  /**
   * The collection's details.
   */
  collection: ProductCollectionDTO
}

export type VendorCollectionListResponse = PaginatedResponse<{
  /**
   * The list of collections.
   */
  collections: ProductCollectionDTO[]
}>
