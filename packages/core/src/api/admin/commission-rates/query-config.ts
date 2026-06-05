export const adminCommissionRateFields = [
  "id",
  "name",
  "code",
  "type",
  "target",
  "value",
  "currency_code",
  "min_amount",
  "include_tax",
  "is_enabled",
  "priority",
  "created_at",
  "updated_at",
  "rules.id",
  "rules.reference",
  "rules.reference_id",
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
