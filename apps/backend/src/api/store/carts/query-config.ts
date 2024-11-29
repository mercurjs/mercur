export const storeOrderSetFields = ['id', 'display_id']

export const storeCartsQueryConfig = {
  list: {
    defaults: storeOrderSetFields,
    isList: true
  },
  retrieve: {
    defaults: storeOrderSetFields,
    isList: false
  }
}
