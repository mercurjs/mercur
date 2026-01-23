import { DeleteResponse, PaginatedResponse } from "@medusajs/types"
import { SellerDTO } from "../seller"

export interface VendorSellerResponse {
  /**
   * The seller's details.
   */
  seller: SellerDTO
}

export type VendorSellerListResponse = PaginatedResponse<{
  /**
   * The list of sellers.
   */
  sellers: SellerDTO[]
}>

export type VendorSellerDeleteResponse = DeleteResponse<"seller">
