export const adminSellerFields = [
  "id",
  "name",
  "handle",
  "email",
  "phone",
  "description",
  "logo",
  "banner",
  "website_url",
  "external_id",
  "currency_code",
  "status",
  "status_reason",
  "approved_at",
  "rejected_at",
  "is_premium",
  "closed_from",
  "closed_to",
  "closure_note",
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
      "is_owner",
      "member.*",
      "created_at",
      "rbac_role.*",
    ],
    defaultLimit: 50,
    isList: true,
  },
}

export const adminMemberInvitesQueryConfig = {
  list: {
    defaults: [
      "id",
      "email",
      "accepted",
      "role_id",
      "token",
      "expires_at",
      "created_at",
      "updated_at",
    ],
    defaultLimit: 50,
    isList: true,
  },
}

export const adminSellerProductsQueryConfig = {
  list: {
    defaults: [
      "id",
      "title",
      "handle",
      "status",
      "thumbnail",
      "*collection",
      "*sales_channels",
      "variants.id",
      "created_at",
      "updated_at",
    ],
    defaultLimit: 50,
    isList: true,
  },
}
