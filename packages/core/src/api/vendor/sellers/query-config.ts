export enum Entities {
  seller = "seller",
  seller_member = "seller_member",
}

export const listVendorSellersQueryConfig = {
  defaults: [
    "id",
    "seller.*",
    "rbac_role.*",
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
    "is_owner",
    "member.*",
    "rbac_role.*",
    "created_at"
  ],
  defaultLimit: 50,
  isList: true,
}

export const retrieveVendorMemberQueryConfig = {
  defaults: [
    "id",
    "is_owner",
    "member.*",
    "rbac_role.*",
    "created_at"
  ],
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
