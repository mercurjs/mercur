import { PaginatedResponse, PricePreferenceDTO } from "@medusajs/types"

export interface VendorPricePreferenceResponse {
  /**
   * The price preference's details.
   */
  price_preference: PricePreferenceDTO
}

export type VendorPricePreferenceListResponse = PaginatedResponse<{
  /**
   * The list of price preferences.
   */
  price_preferences: PricePreferenceDTO[]
}>
