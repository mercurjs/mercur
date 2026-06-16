export const adminCommissionRateFields = [
  "id",
  "name",
  "code",
  "type",
  "value",
  "currency_code",
  "include_tax",
  "include_shipping",
  "is_enabled",
  "is_default",
  "created_at",
  "updated_at",
  "rules.id",
  "rules.reference",
  "rules.reference_id",
  "values.id",
  "values.currency_code",
  "values.amount",
]

export const adminCommissionRateQueryConfig = {
  list: {
    defaults: adminCommissionRateFields,
    isList: true,
  },
  retrieve: {
    defaults: adminCommissionRateFields,
    isList: false,
  },
}
