export const vendorPayoutAccountFields = [
  "id",
  "status",
  "data",
  "context",
  "created_at",
  "updated_at",
  "onboarding.id",
  "onboarding.data",
  "onboarding.context",
  "onboarding.created_at",
  "onboarding.updated_at",
]

export const vendorPayoutAccountQueryConfig = {
  list: {
    defaults: vendorPayoutAccountFields,
    allowed: vendorPayoutAccountFields,
    isList: true,
  },
  retrieve: {
    defaults: vendorPayoutAccountFields,
    allowed: vendorPayoutAccountFields,
    isList: false,
  },
}

export const vendorMyPayoutAccountFields = [
  "id",
  "external_id",
  "status",
  "kyc_status",
  "payouts_enabled",
  "charges_enabled",
  "details_submitted",
  "disabled_reason",
  "last_synced_at",
  "created_at",
  "updated_at",
  "onboarding.id",
  "onboarding.account_id",
  "onboarding.data",
  "onboarding.created_at",
  "onboarding.updated_at",
]

export const vendorMyPayoutAccountQueryConfig = {
  retrieve: {
    defaults: vendorMyPayoutAccountFields,
    allowed: vendorMyPayoutAccountFields,
    isList: false,
  },
}

export const vendorOnboardingFields = [
  "id",
  "data",
  "context",
  "created_at",
  "updated_at",
]

export const vendorOnboardingQueryConfig = {
  retrieve: {
    defaults: vendorOnboardingFields,
    allowed: vendorOnboardingFields,
    isList: false,
  },
}
