export interface CampaignFormFields {
  name: string
  description?: string
  campaign_identifier: string
  starts_at: Date | null
  ends_at: Date | null
  budget: {
    type: "spend" | "usage"
    limit?: number | null
    currency_code?: string | null
  }
}
export interface WithNestedCampaign {
  campaign?: CampaignFormFields
  application_method?: {
    currency_code?: string
  }
}