export const adminReviewsFields = [
  'id',
  'reference',
  'rating',
  'customer_note',
  'seller_note',
  'created_at',
  'updated_at'
]

export const adminReviewsConfig = {
  list: {
    defaults: adminReviewsFields,
    isList: true
  },
  retrieve: {
    defaults: adminReviewsFields,
    isList: false
  }
}
