export const vendorSellerFields = [
  'id',
  'name',
  'handle',
  'description',
  'photo'
]

export const vendorSellerQueryConfig = {
  list: {
    defaults: vendorSellerFields,
    isList: true
  },
  retrieve: {
    defaults: vendorSellerFields,
    isList: false
  }
}
