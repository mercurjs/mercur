export const storeSellerFields = [
  'id',
  'store_status',
  'name',
  'handle',
  'description',
  'photo',
  'address_line',
  'city',
  'postal_code',
  'country_code',
  'tax_id',
  'created_at',
  'updated_at',
  'reviews.rating',
  'reviews.customer_note',
  'reviews.seller_note',
  'reviews.created_at',
  'reviews.updated_at',
  'reviews.customer.first_name',
  'reviews.customer.last_name'
]

export const storeSellerQueryConfig = {
  list: {
    defaults: storeSellerFields,
    allowed: storeSellerFields,
    isList: true
  },
  retrieve: {
    defaults: storeSellerFields,
    allowed: storeSellerFields,
    isList: false
  }
}
