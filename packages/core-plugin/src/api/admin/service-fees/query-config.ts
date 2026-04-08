export const adminServiceFeeFields = [
  "id",
  "name",
  "display_name",
  "code",
  "type",
  "target",
  "charging_level",
  "status",
  "value",
  "currency_code",
  "min_amount",
  "max_amount",
  "include_tax",
  "is_enabled",
  "priority",
  "effective_date",
  "start_date",
  "end_date",
  "replaces_fee_id",
  "created_at",
  "updated_at",
  "rules.id",
  "rules.reference",
  "rules.reference_id",
  "rules.mode",
]

export const adminServiceFeeQueryConfig = {
  list: {
    defaults: adminServiceFeeFields,
    isList: true,
  },
  retrieve: {
    defaults: adminServiceFeeFields,
    isList: false,
  },
}

export const adminServiceFeeChangeLogFields = [
  "id",
  "service_fee_id",
  "action",
  "changed_by",
  "previous_snapshot",
  "new_snapshot",
  "created_at",
]

export const adminServiceFeeChangeLogQueryConfig = {
  list: {
    defaults: adminServiceFeeChangeLogFields,
    isList: true,
  },
}
