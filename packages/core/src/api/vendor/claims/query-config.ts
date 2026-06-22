export const vendorClaimFields = [
  "id",
  "order_id",
  "return_id",
  "display_id",
  "no_notification",
  "type",
  "created_by",
  "created_at",
  "updated_at",
  "canceled_at",
]

export const vendorClaimDetailFields = [
  ...vendorClaimFields,
  "additional_items.*",
  "claim_items.*",
]

export const vendorClaimQueryConfig = {
  list: {
    defaults: vendorClaimFields,
    isList: true,
  },
  retrieve: {
    defaults: vendorClaimDetailFields,
    isList: false,
  },
}
