export const vendorCustomerGroupsFields = [
  'id',
  'name',
  'customers.id',
  'customers.first_name',
  'customers.last_name',
  'customers.email',
  'created_at',
  'updated_at',
  'deleted_at'
]

export const vendorCustomerGroupsQueryConfig = {
  list: {
    defaults: vendorCustomerGroupsFields,
    isList: true
  },
  retrieve: {
    defaults: vendorCustomerGroupsFields,
    isList: false
  }
}
