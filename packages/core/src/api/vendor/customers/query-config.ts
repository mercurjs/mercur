export const vendorCustomerFields = [
  "id",
  "email",
  "company_name",
  "first_name",
  "last_name",
  "phone",
  "has_account",
  "created_at",
  "updated_at",
  "metadata",
  "*addresses",
  "*groups",
]

export const vendorCustomerQueryConfig = {
  list: {
    defaults: vendorCustomerFields,
    isList: true,
  },
  retrieve: {
    defaults: vendorCustomerFields,
    isList: false,
  },
}
