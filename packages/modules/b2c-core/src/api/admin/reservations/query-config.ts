import { vendorInventoryItemFields } from '../../vendor/inventory-items/query-config'

export const adminReservationFields = [
  'id',
  'location_id',
  'inventory_item_id',
  'quantity',
  'line_item_id',
  'description',
  'external_id',
  'metadata',
  'created_by',
  'created_at',
  'updated_at',
  'deleted_at',
  ...vendorInventoryItemFields.map((field) => `inventory_item.${field}`)
]

export const adminReservationQueryConfig = {
  list: {
    defaults: adminReservationFields,
    isList: true
  },
  retrieve: {
    defaults: adminReservationFields,
    isList: false
  }
}
