export const vendorMemberFields = [
  "id",
  "email",
  "role",
  "name",
  "bio",
  "phone",
  "photo",
  "seller_id",
]

export const vendorMemberQueryConfig = {
  list: {
    defaults: vendorMemberFields,
    isList: true,
  },
  retrieve: {
    defaults: vendorMemberFields,
    isList: false,
  },
}
