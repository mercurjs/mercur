export const adminPayoutFields = [
  "id",
  "amount",
  "currency_code",
  "status",
  "data",
  "created_at",
  "updated_at",
  "account.id",
  "account.status",
  "seller.id",
  "seller.name",
  "seller.handle",
  "display_id",
  "status_reason",
  "provider_payout_id",
  "order_id",
  "metadata",
  "reversals.*",
  "account.seller.id",
  "account.seller.name",
  "account.seller.handle",
]

export const adminPayoutQueryConfig = {
  list: {
    defaults: adminPayoutFields,
    isList: true,
  },
  retrieve: {
    defaults: adminPayoutFields,
    isList: false,
  },
}
