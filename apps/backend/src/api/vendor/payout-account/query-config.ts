export const vendorPayoutAccountFields = [
  'id',
  'status',
  'reference_id',
  'data'
]

export const vendorPayoutAccountQueryConfig = {
  retrieve: {
    defaults: vendorPayoutAccountFields,
    isList: false
  }
}
