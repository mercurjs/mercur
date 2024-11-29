export const vendorSellerFields = [
  'id',
  'name',
  'handle',
  'description',
  'photo',
  '*members'
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
