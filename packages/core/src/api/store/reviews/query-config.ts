export const storeReviewFields = [
  "id",
  "display_id",
  "reference",
  "rating",
  "customer_note",
  "seller_note",
  "status",
  "customer.first_name",
  "customer.last_name",
  "created_at",
  "updated_at",
]

export const storeReviewQueryConfig = {
  list: {
    defaults: storeReviewFields,
    isList: true,
  },
  retrieve: {
    defaults: storeReviewFields,
    isList: false,
  },
}

export const storePublicReviewFields = [
  "id",
  "display_id",
  "rating",
  "customer_note",
  "seller_note",
  "customer.first_name",
  "customer.last_name",
  "created_at",
  "updated_at",
]

export const storePublicReviewQueryConfig = {
  list: {
    defaults: storePublicReviewFields,
    defaultLimit: 50,
    isList: true,
  },
}
