import { PaginatedResponse, SalesChannelDTO } from "@medusajs/types"

export interface VendorSalesChannelResponse {
  /**
   * The sales channel's details.
   */
  sales_channel: SalesChannelDTO
}

export type VendorSalesChannelListResponse = PaginatedResponse<{
  /**
   * The list of sales channels.
   */
  sales_channels: SalesChannelDTO[]
}>
