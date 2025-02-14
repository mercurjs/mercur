export const adminSellerFields = [
  'id',
  'name',
  'handle',
  'description',
  'photo'
]

export const adminSellerQueryConfig = {
  list: {
    defaults: adminSellerFields,
    isList: true
  },
  retrieve: {
    defaults: adminSellerFields,
    isList: false
  }
}
