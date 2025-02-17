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

export const vendorReviewFields = [
  'id',
  'rating',
  'customer_note',
  'customer_id',
  'seller_note',
  'created_at',
  'updated_at'
]

export const vendorReviewQueryConfig = {
  list: {
    defaults: vendorReviewFields,
    isList: true
  },
  retrieve: {
    defaults: vendorReviewFields,
    isList: false
  }
}
