export const storeReviewFields = [
  'id',
  'reference',
  'rating',
  'customer_note',
  'customer.*',
  'seller_note',
  'created_at',
  'updated_at'
]

export const storeReviewQueryConfig = {
  list: {
    defaults: storeReviewFields,
    isList: true
  },
  retrieve: {
    defaults: storeReviewFields,
    isList: false
  }
}
