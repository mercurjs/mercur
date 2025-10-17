export const defaultVendorNotificationFields = [
  'id',
  'to',
  'channel',
  'template',
  'data',
  'created_at',
  'updated_at'
]

export const vendorNotificationQueryConfig = {
  list: {
    defaults: defaultVendorNotificationFields,
    isList: true
  },
  retrieve: {
    defaults: defaultVendorNotificationFields,
    isList: false
  }
}
