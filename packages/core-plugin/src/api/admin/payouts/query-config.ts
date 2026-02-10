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
