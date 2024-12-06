export const vendorShippingOptionFields = [
  'id',
  'name',
  'price_type',
  'data',
  'provider_id',
  'metadata',
  'created_at',
  'updated_at',
  '*type',
  '*prices',
  '*service_zone',
  '*shipping_profile',
  '*provider'
]

export const vendorShippingOptionQueryConfig = {
  list: {
    defaults: vendorShippingOptionFields,
    isList: true
  },
  retrieve: {
    defaults: vendorShippingOptionFields,
    isList: false
  }
}
