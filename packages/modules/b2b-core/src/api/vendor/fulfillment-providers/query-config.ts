export const vendorAdminFulfillmentProvidersFields = ['id', 'is_enabled']

export const vendorFulfillmentProvidersQueryConfig = {
  list: {
    defaults: vendorAdminFulfillmentProvidersFields,
    isList: true
  },
  retrieve: {
    defaults: vendorAdminFulfillmentProvidersFields,
    isList: false
  }
}
