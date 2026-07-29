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
