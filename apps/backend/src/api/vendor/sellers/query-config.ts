export const vendorSellerFields = [
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
  'tax_id'
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

export const vendorOnboardingFields = [
  'id',
  'seller_id',
  'store_information',
  'stripe_connection',
  'locations_shipping',
  'products',
  'created_at',
  'updated_at'
]

export const vendorOnboardingQueryConfig = {
  retrieve: {
    defaults: vendorOnboardingFields,
    isList: false
  }
}
