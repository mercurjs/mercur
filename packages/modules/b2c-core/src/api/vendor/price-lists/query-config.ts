export const vendorPriceListPriceQueryFields = [
  'id',
  'currency_code',
  'amount',
  'min_quantity',
  'max_quantity',
  'created_at',
  'deleted_at',
  'updated_at',
  'price_set.variant.id',
  'price_rules.value',
  'price_rules.attribute'
]

export const vendorPriceListQueryFields = [
  'id',
  'type',
  'description',
  'title',
  'status',
  'starts_at',
  'ends_at',
  'created_at',
  'updated_at',
  'deleted_at',
  'price_list_rules.value',
  'price_list_rules.attribute',
  ...vendorPriceListPriceQueryFields.map((field) => `prices.${field}`)
]

export const vendorPriceListQueryConfig = {
  list: {
    defaults: vendorPriceListQueryFields,
    isList: true
  },
  retrieve: {
    defaults: vendorPriceListQueryFields,
    isList: false
  }
}

export const vendorPriceListPriceQueryConfig = {
  list: {
    defaults: vendorPriceListPriceQueryFields,
    isList: true
  },
  retrieve: {
    defaults: vendorPriceListPriceQueryFields,
    isList: false
  }
}
