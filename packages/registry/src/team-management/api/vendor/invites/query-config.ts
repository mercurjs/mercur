export const vendorMemberInviteFields = [
  "id",
  "email",
  "role",
  "expires_at",
  "accepted",
  "seller_id",
]

export const vendorMemberInviteQueryConfig = {
  list: {
    defaults: vendorMemberInviteFields,
    isList: true,
  },
  retrieve: {
    defaults: vendorMemberInviteFields,
    isList: false,
  },
}
