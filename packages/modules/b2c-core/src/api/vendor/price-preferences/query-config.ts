export const vendorPricePreferenceRemoteQueryFields = [
  'id',
  'attribute',
  'value',
  'is_tax_inclusive',
  'created_at',
  'deleted_at',
  'updated_at'
]

export const retrivePricePreferenceQueryConfig = {
  defaults: vendorPricePreferenceRemoteQueryFields,
  isList: false
}

export const listPricePreferenceQueryConfig = {
  ...retrivePricePreferenceQueryConfig,
  isList: true
}
