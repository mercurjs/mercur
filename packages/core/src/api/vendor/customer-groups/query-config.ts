export const vendorCustomerGroupFields = [
  "id",
  "name",
  "created_at",
  "updated_at",
  "metadata",
  "customers.id",
]

export const vendorCustomerGroupQueryConfig = {
  list: {
    defaults: vendorCustomerGroupFields,
    isList: true,
  },
  retrieve: {
    defaults: vendorCustomerGroupFields,
    isList: false,
  },
}
