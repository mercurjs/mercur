export const defaultVendorPromotionFields = [
  "id",
  "code",
  "is_automatic",
  "is_tax_inclusive",
  "type",
  "status",
  "created_at",
  "updated_at",
  "deleted_at",
  "*campaign",
  "*campaign.budget",
  "*application_method",
  "*application_method.buy_rules",
  "application_method.buy_rules.values.value",
  "*application_method.target_rules",
  "application_method.target_rules.values.value",
  "rules.id",
  "rules.attribute",
  "rules.operator",
  "rules.values.value",
]

export const defaultVendorPromotionRuleFields = [
  "id",
  "description",
  "attribute",
  "operator",
  "values.value",
]

export const vendorPromotionQueryConfig = {
  list: {
    defaults: defaultVendorPromotionFields,
    isList: true,
  },
  retrieve: {
    defaults: defaultVendorPromotionFields,
    isList: false,
  },
}

export const vendorPromotionRuleQueryConfig = {
  list: {
    defaults: defaultVendorPromotionRuleFields,
    isList: true,
  },
  retrieve: {
    defaults: defaultVendorPromotionRuleFields,
    isList: false,
  },
}

export const vendorRuleValueQueryConfig = {
  list: {
    defaults: [],
    allowed: [],
    isList: true,
  },
}
