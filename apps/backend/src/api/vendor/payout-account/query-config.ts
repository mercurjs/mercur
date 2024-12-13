export const vendorPayoutAccountFields = [
  'id',
  'status',
  'reference_id',
  'data',
  'context',
  '*onboarding'
]

export const vendorPayoutAccountQueryConfig = {
  retrieve: {
    defaults: vendorPayoutAccountFields,
    isList: false
  }
}
