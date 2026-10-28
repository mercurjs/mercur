export const adminAdjustmentFields = [
  "id",
  "account_id",
  "type",
  "amount",
  "currency_code",
  "reason",
  "created_by",
  "status",
  "status_reason",
  "provider_transfer_id",
  "created_at",
  "updated_at",
  "payout_account.id",
  "payout_account.seller.id",
  "payout_account.seller.name",
  "payout_account.seller.handle",
]

export const adminAdjustmentQueryConfig = {
  list: { defaults: adminAdjustmentFields, isList: true, defaultLimit: 20 },
}
