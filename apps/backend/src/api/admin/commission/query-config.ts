export const adminCommissionRateFields = [
  'id',
  'type',
  'percentage_rate',
  'is_default',
  'include_tax',
  'include_shipping',
  'price_set_id',
  'max_price_set_id',
  'min_price_set_id',
  'created_at',
  'updated_at',
  '*rule'
]

export const adminCommissionRateQueryConfig = {
  list: {
    defaults: adminCommissionRateFields,
    isList: true
  },
  retrieve: {
    defaults: adminCommissionRateFields,
    isList: false
  }
}

export const adminCommissionRuleFields = [
  'id',
  'reference',
  'reference_id',
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
