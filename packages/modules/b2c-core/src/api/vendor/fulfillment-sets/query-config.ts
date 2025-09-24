export const vendorFulfillmentSetFields = [
  'id',
  'name',
  'type',
  'created_at',
  'updated_at',
  'deleted_at',
  '*service_zones',
  '*service_zones.geo_zones'
]

export const vendorFulfillmentSetQueryConfig = {
  list: {
    defaults: vendorFulfillmentSetFields,
    isList: true
  },
  retrieve: {
    defaults: vendorFulfillmentSetFields,
    isList: false
  }
}
