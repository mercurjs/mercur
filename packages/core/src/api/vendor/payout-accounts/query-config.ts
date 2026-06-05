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
    isList: true,
  },
  retrieve: {
    defaults: vendorPayoutAccountFields,
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
    isList: false,
  },
}
