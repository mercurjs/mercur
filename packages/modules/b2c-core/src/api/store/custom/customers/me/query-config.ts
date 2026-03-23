export const storeCustomerFields = [
  'id',
  'email',
  'phone',
  'company_name',
  'first_name',
  'last_name',
  'has_account',
  'file.id',
  'file.url',
  'created_at',
  'updated_at'
]

export const storeCustomerQueryConfig = {
  defaults: storeCustomerFields,
  isList: false
}
