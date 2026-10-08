export const defaultAdminOfferConditionFields = [
  "id",
  "code",
  "label",
  "is_active",
  "rank",
  "metadata",
  "created_at",
  "updated_at",
  "deleted_at",
]

export const adminOfferConditionQueryConfig = {
  list: {
    defaults: defaultAdminOfferConditionFields,
    isList: true,
  },
  retrieve: {
    defaults: defaultAdminOfferConditionFields,
    isList: false,
  },
}
