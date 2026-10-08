export const defaultVendorOfferConditionFields = [
  "id",
  "code",
  "label",
  "rank",
  "metadata",
  "created_at",
  "updated_at",
]

export const vendorOfferConditionQueryConfig = {
  list: {
    defaults: defaultVendorOfferConditionFields,
    isList: true,
  },
  retrieve: {
    defaults: defaultVendorOfferConditionFields,
    isList: false,
  },
}
