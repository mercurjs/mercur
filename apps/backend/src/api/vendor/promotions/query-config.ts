export const vendorPromotionFields = [
  'id',
  'code',
  'is_automatic',
  'type',
  'created_at',
  'updated_at',
  'deleted_at',
  '*campaign',
  '*campaign.budget',
  '*application_method',
  '*application_method.target_rules',
  'application_method.target_rules.values.value',
  'rules.id',
  'rules.attribute',
  'rules.operator',
  'rules.values.value'
]

export const vendorPromotionQueryConfig = {
  list: {
    defaults: vendorPromotionFields,
    isList: true
  },
  retrieve: {
    defaults: vendorPromotionFields,
    isList: false
  }
}

export const defaultVendorPromotionRuleFields = [
  'id',
  'description',
  'attribute',
  'operator',
  'values.value'
]

export const vendorRuleTransformQueryConfig = {
  list: {
    defaults: defaultVendorPromotionRuleFields,
    isList: true
  },
  retrieve: {
    defaults: defaultVendorPromotionRuleFields,
    isList: false
  }
}

export const listRuleValueTransformQueryConfig = {
  defaults: [],
  allowed: [],
  isList: true
}
