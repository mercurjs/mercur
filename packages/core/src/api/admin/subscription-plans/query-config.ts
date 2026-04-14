export const subscriptionPlanFields = [
  "id",
  "currency_code",
  "monthly_amount",
  "free_months",
  "requires_orders",
  "*overrides",
  "metadata",
  "created_at",
  "updated_at",
]

export const subscriptionOverrideFields = [
  "id",
  "reference",
  "reference_id",
  "plan_id",
  "monthly_amount",
  "free_months",
  "free_from",
  "free_to",
  "metadata",
  "created_at",
  "updated_at",
]

export const subscriptionPlanQueryConfig = {
  list: {
    defaults: subscriptionPlanFields,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: subscriptionPlanFields,
    isList: false,
  },
  retrieveOverride: {
    defaults: subscriptionOverrideFields,
    isList: false,
  },
}
