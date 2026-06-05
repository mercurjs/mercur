export const defaultVendorSalesChannelFields = [
  "id",
  "name",
  "description",
  "is_disabled",
  "created_at",
  "updated_at",
  "metadata",
]

export const retrieveTransformQueryConfig = {
  defaults: defaultVendorSalesChannelFields,
  isList: false,
}

export const listTransformQueryConfig = {
  ...retrieveTransformQueryConfig,
  defaultLimit: 10,
  isList: true,
}
