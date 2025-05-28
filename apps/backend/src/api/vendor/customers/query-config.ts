export const vendorCustomerFields = [
  'id',
  'email',
  'phone',
  'company_name',
  'first_name',
  'last_name',
  'has_account',
  'groups.id',
  'groups.name',
  'created_at',
  'updated_at',
  'deleted_at'
]

export const vendorCustomersFields = [
  'id',
  'email',
  'phone',
  'company_name',
  'first_name',
  'last_name',
  'has_account',
  'groups.id',
  'created_at',
  'updated_at',
  'deleted_at'
]

export const vendorCustomerQueryConfig = {
  list: {
    defaults: vendorCustomersFields,
    isList: true
  },
  retrieve: {
    defaults: vendorCustomerFields,
    isList: false
  }
}

export const vendorCustomerOrdersFields = [
  'id',
  'region_id',
  'display_id',
  'customer_id',
  'version',
  'sales_channel_id',
  'status',
  'summary',
  'is_draft_order',
  'email',
  'currency_code',
  'shipping_address_id',
  'billing_address_id',
  'no_notification',
  'created_at',
  'updated_at',
  'deleted_at'
]

export const vendorCustomerOrdersQueryConfig = {
  list: {
    defaults: vendorCustomerOrdersFields,
    isList: true
  },
  retrieve: {
    defaults: vendorCustomerOrdersFields,
    isList: false
  }
}
