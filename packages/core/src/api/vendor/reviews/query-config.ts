export const vendorReviewFields = [
  "id",
  "display_id",
  "reference",
  "rating",
  "customer_note",
  "seller_note",
  "status",
  "created_at",
  "updated_at",
  "customer.id",
  "customer.first_name",
  "customer.last_name",
  "customer.email",
  "order.id",
  "order.display_id",
  "order.created_at",
]

export const vendorReviewQueryConfig = {
  list: {
    defaults: vendorReviewFields,
    isList: true,
  },
  retrieve: {
    defaults: vendorReviewFields,
    isList: false,
  },
}
