import { HttpTypes } from "@medusajs/types"

export interface VendorExtendedAdminStockLocationAddress extends HttpTypes.AdminStockLocationAddress {
    metadata: Record<string, unknown> | null
    created_at: string
    updated_at: string
    deleted_at: string | null
  }
  
  export interface VendorExtendedAdminFulfillmentProvider extends HttpTypes.AdminFulfillmentProvider {
    created_at: string
    updated_at: string
    deleted_at: string | null
  }
  
  export interface VendorExtendedAdminServiceZone {
    id: string
    name: string
    fulfillment_set_id: string
    fulfillment_set?: VendorExtendedAdminFulfillmentSet
    geo_zones: HttpTypes.AdminGeoZone[]
    shipping_options: HttpTypes.AdminShippingOption[]
    metadata: Record<string, unknown> | null
    created_at: string
    updated_at: string
    deleted_at: string | null
  }
  
  export interface VendorExtendedAdminFulfillmentSet {
    id: string
    name: string
    type: string
    location?: VendorExtendedAdminStockLocation
    service_zones: VendorExtendedAdminServiceZone[]
    created_at: string
    updated_at: string
    deleted_at: string | null
  }
  
  export interface VendorExtendedAdminStockLocation {
    id: string
    name: string
    address_id: string
    address?: VendorExtendedAdminStockLocationAddress
    sales_channels?: HttpTypes.AdminSalesChannel[]
    fulfillment_providers?: VendorExtendedAdminFulfillmentProvider[]
    fulfillment_sets?: VendorExtendedAdminFulfillmentSet[]
  }
  
  export interface VendorExtendedAdminStockLocationResponse {
    stock_location: VendorExtendedAdminStockLocation
  } 