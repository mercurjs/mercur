export const vendorPayoutAccountFields = [
  'id',
  'status',
  'reference_id',
  'data',
  'context',
  'payment_provider_id',
  '*onboarding',
]

export const vendorPayoutAccountQueryConfig = {
  retrieve: {
    defaults: vendorPayoutAccountFields,
    isList: true
  }
}
