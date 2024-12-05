export const vendorShippingOptionFields = [
  'id',
  'name',
  '*geo_zones',
  '*shipping_options'
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
