import type { HttpTypes, PaginatedResponse } from "@medusajs/types"

export type ExtendedAdminFulfillmentProviderOption = HttpTypes.AdminFulfillmentProviderOption & {
  name?: string
}

export type ExtendedAdminFulfillmentProviderOptionsListResponse = PaginatedResponse<{
    fulfillment_options: ExtendedAdminFulfillmentProviderOption[]
}>