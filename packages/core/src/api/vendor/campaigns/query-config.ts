export const defaultVendorCampaignFields = [
  "id",
  "name",
  "description",
  "currency",
  "campaign_identifier",
  "*budget",
  "starts_at",
  "ends_at",
  "created_at",
  "updated_at",
  "deleted_at",
]

export const vendorCampaignQueryConfig = {
  list: {
    defaults: defaultVendorCampaignFields,
    isList: true,
  },
  retrieve: {
    defaults: defaultVendorCampaignFields,
    isList: false,
  },
}
