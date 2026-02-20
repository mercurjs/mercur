export const vendorMemberInviteFields = [
  "id",
  "email",
  "role",
  "expires_at",
  "accepted",
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
