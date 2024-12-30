export const adminComissionRateFields = [
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

export const adminComissionRateQueryConfig = {
  list: {
    defaults: adminComissionRateFields,
    isList: true
  },
  retrieve: {
    defaults: adminComissionRateFields,
    isList: false
  }
}

export const adminComissionRuleFields = [
  'id',
  'reference',
  'reference_id',
  'rate_id',
  'created_at',
  'updated_at',
  '*rate'
]

export const adminComissionRuleQueryConfig = {
  list: {
    defaults: adminComissionRuleFields,
    isList: true
  },
  retrieve: {
    defaults: adminComissionRuleFields,
    isList: false
  }
}
