import { vendorInventoryItemFields } from '../inventory-items/query-config'

export const vendorReservationFields = [
  'id',
  'location_id',
  'inventory_item_id',
  'quantity',
  'line_item_id',
  'description',
  'created_at',
  'updated_at',
  ...vendorInventoryItemFields.map((f) => `inventory_item.${f}`)
]

export const vendorReservationQueryConfig = {
  list: {
    defaults: vendorReservationFields,
    isList: true
  },
  retrieve: {
    defaults: vendorReservationFields,
    isList: false
  }
}
