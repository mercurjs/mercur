import { withRbacRoleFields } from "../../utils/rbac-role-fields"

export enum Entities {
  seller = "seller",
  seller_member = "seller_member",
}

export const listVendorSellersQueryConfig = {
  get defaults() {
    return withRbacRoleFields([
      "id",
      "seller.*",
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

export const listVendorMembersQueryConfig = {
  get defaults() {
    return withRbacRoleFields([
      "id",
      "is_owner",
      "member.*",
      "created_at",
    ])
  },
  defaultLimit: 50,
  isList: true,
}

export const retrieveVendorMemberQueryConfig = {
  get defaults() {
    return withRbacRoleFields([
      "id",
      "is_owner",
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
