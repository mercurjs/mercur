export const listVendorSellersQueryConfig = {
  defaults: [
    "id",
    "seller.*",
    "role.*",
  ],
  defaultLimit: 50,
  isList: true,
}

export const retrieveVendorSellerQueryConfig = {
  defaults: [
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
  ],
}

export const listVendorMembersQueryConfig = {
  defaults: [
    "id",
    "member.*",
    "role.*",
  ],
  defaultLimit: 50,
  isList: true,
}
