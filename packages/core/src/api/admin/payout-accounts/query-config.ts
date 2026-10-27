export const adminPayoutAccountFields = [
  "id",
  "provider_account_id",
  "status",
  "kyc_status",
  "payouts_enabled",
  "charges_enabled",
  "details_submitted",
  "disabled_reason",
  "requirements",
  "last_synced_at",
  "created_at",
  "updated_at",
  "onboarding.id",
  "onboarding.data",
  "seller.id",
  "seller.name",
  "seller.handle",
]

export const adminPayoutAccountQueryConfig = {
  list: { defaults: adminPayoutAccountFields, isList: true },
  retrieve: { defaults: adminPayoutAccountFields, isList: false },
}
