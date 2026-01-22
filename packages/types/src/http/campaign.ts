import { CampaignDTO, DeleteResponse, PaginatedResponse } from "@medusajs/framework/types"

export type VendorCampaign = CampaignDTO

export type VendorCampaignResponse = {
  campaign: VendorCampaign
}

export type VendorCampaignListResponse = PaginatedResponse<{
  campaigns: VendorCampaign[]
}>

export type VendorCampaignDeleteResponse = DeleteResponse<"campaign">
