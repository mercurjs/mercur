import { PaginatedResponse, StockLocationDTO } from "@medusajs/types"

export interface VendorStockLocationResponse {
  /**
   * The stock location's details.
   */
  stock_location: StockLocationDTO
}

export type VendorStockLocationListResponse = PaginatedResponse<{
  /**
   * The list of stock locations.
   */
  stock_locations: StockLocationDTO[]
}>
