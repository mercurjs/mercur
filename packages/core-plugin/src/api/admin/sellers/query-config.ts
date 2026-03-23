export const adminSellerFields = [
  "id",
  "name",
  "handle",
  "email",
  "description",
  "logo",
  "banner",
  "website_url",
  "external_id",
  "currency_code",
  "status",
  "is_premium",
  "closed_from",
  "closed_to",
  "*address",
  "*payment_details",
  "*professional_details",
  "metadata",
  "created_at",
  "updated_at",
  "payout_account.id",
  "payout_account.status",
  "payout_account.data",
  "payout_account.created_at",
  "payout_account.onboarding.id",
  "payout_account.onboarding.data",
]

export const adminSellerRetrieveFields = [
  ...adminSellerFields,
  "*members",
]

export const adminSellerQueryConfig = {
  list: {
    defaults: adminSellerFields,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: adminSellerRetrieveFields,
    isList: false,
  },
}

export const adminMembersQueryConfig = {
  list: {
    defaults: [
      "id",
      "member.*",
      "role.*",
    ],
    defaultLimit: 50,
    isList: true,
  },
}
