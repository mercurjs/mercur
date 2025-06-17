export const adminCommissionRuleFields = [
  'id',
  'name',
  'reference',
  'reference_id',
  'is_active',
  'rate_id',
  'created_at',
  'updated_at',
  '*rate'
]

export const adminCommissionRuleQueryConfig = {
  list: {
    defaults: adminCommissionRuleFields,
    isList: true
  },
  retrieve: {
    defaults: adminCommissionRuleFields,
    isList: false
  }
}

export const adminCommissionLinesQueryConfig = {
  list: {
    defaults: [],
    isList: true
  },
  retrieve: {
    defaults: [],
    isList: false
  }
}
