export const vendorCampaignFields = [
  'id',
  'name',
  'description',
  'currency',
  'campaign_identifier',
  '*budget',
  'starts_at',
  'ends_at',
  'created_at',
  'updated_at',
  'deleted_at'
]

export const vendorCampaignQueryConfig = {
  list: {
    defaults: vendorCampaignFields,
    isList: true
  },
  retrieve: {
    defaults: vendorCampaignFields,
    isList: false
  }
}
