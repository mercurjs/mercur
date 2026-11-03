
export const listVendorSellersQueryConfig = {
  get defaults() {
    return ([
      "id",
      "seller.*",
      "role_id",
    ])
  },
  defaultLimit: 50,
  isList: true,
}

export const retrieveVendorSellerQueryConfig = {
  defaults: [
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
    "approved_at",
    "rejected_at",
    "is_premium",
    "default_leadtime_to_ship",
    "closed_from",
    "closed_to",
    "closure_note",
    "*address",
    "*payment_details",
    "*professional_details",
    "metadata",
  ],
}

// `GET /vendor/sellers/me` has no permission gate, so it carries the public
// profile only; payment and professional details are blocked on it and read
// through `GET /vendor/sellers/:id` behind `store:view`.
export const retrieveVendorSellerMeQueryConfig = {
  defaults: retrieveVendorSellerQueryConfig.defaults.filter(
    (field) => field !== "*payment_details" && field !== "*professional_details"
  ),
}

export const listVendorMembersQueryConfig = {
  get defaults() {
    return ([
      "id",
      "is_owner",
      "role_id",
      "member.*",
      "created_at",
    ])
  },
  defaultLimit: 50,
  isList: true,
}

export const retrieveVendorMemberQueryConfig = {
  get defaults() {
    return ([
      "id",
      "is_owner",
      "role_id",
      "member.*",
      "created_at",
    ])
  },
}

export const listVendorMemberInvitesQueryConfig = {
  defaults: [
    "id",
    "email",
    "accepted",
    "role_id",
    "expires_at",
    "created_at",
  ],
  defaultLimit: 50,
  isList: true,
}
