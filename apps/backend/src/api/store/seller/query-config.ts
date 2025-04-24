export const storeSellerFields = [
  'id',
  'name',
  'handle',
  'description',
  'photo',
  'address_line',
  'city',
  'postal_code',
  'country_code',
  'tax_id',
  'type'
]

export const storeSellerQueryConfig = {
  list: {
    defaults: storeSellerFields,
    isList: true
  },
  retrieve: {
    defaults: storeSellerFields,
    isList: false
  }
}
