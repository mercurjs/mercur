export const vendorServiceZoneFields = [
  'id',
  'name',
  '*geo_zones',
  '*shipping_options'
]

export const vendorServiceZoneQueryConfig = {
  list: {
    defaults: vendorServiceZoneFields,
    isList: true
  },
  retrieve: {
    defaults: vendorServiceZoneFields,
    isList: false
  }
}
