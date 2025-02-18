export const vendorProductFields = [
  'id',
  'title',
  'subtitle',
  'status',
  'external_id',
  'description',
  'handle',
  'is_giftcard',
  'discountable',
  'thumbnail',
  'collection_id',
  'type_id',
  'weight',
  'length',
  'height',
  'width',
  'hs_code',
  'origin_country',
  'mid_code',
  'material',
  'metadata',
  'brand.name',
  '*type',
  '*collection',
  '*options',
  '*options.values',
  '*tags',
  '*images',
  '*variants',
  '*variants.prices',
  'variants.prices.price_rules.value',
  'variants.prices.price_rules.attribute',
  '*variants.options'
]

export const vendorProductQueryConfig = {
  list: {
    defaults: vendorProductFields,
    isList: true
  },
  retrieve: {
    defaults: vendorProductFields,
    isList: false
  }
}
