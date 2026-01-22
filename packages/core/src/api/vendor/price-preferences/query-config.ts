export const defaultVendorPricePreferenceFields = [
  "id",
  "attribute",
  "value",
  "is_tax_inclusive",
  "created_at",
  "updated_at",
]

export const retrieveTransformQueryConfig = {
  defaults: defaultVendorPricePreferenceFields,
  isList: false,
}

export const listTransformQueryConfig = {
  ...retrieveTransformQueryConfig,
  defaultLimit: 10,
  isList: true,
}
