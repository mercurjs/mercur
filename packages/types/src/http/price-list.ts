import { PaginatedResponse, PriceListDTO } from "@medusajs/types"

export interface VendorPriceListResponse {
  /**
   * The price list's details.
   */
  price_list: PriceListDTO
}

export type VendorPriceListListResponse = PaginatedResponse<{
  /**
   * The list of price lists.
   */
  price_lists: PriceListDTO[]
}>
