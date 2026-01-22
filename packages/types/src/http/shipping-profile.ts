import {
  DeleteResponse,
  PaginatedResponse,
  ShippingProfileDTO,
} from "@medusajs/types"

export interface VendorShippingProfileResponse {
  /**
   * The shipping profile's details.
   */
  shipping_profile: ShippingProfileDTO
}

export type VendorShippingProfileListResponse = PaginatedResponse<{
  /**
   * The list of shipping profiles.
   */
  shipping_profiles: ShippingProfileDTO[]
}>

export type VendorShippingProfileDeleteResponse = DeleteResponse<"shipping_profile">
