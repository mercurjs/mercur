export const defaultAdminReservationFields = [
    "id",
    "location_id",
    "inventory_item_id",
    "quantity",
    "line_item_id",
    "description",
    "created_at",
    "updated_at",
    "inventory_item.id",
    "inventory_item.sku",
    "inventory_item.title",
    "inventory_item.thumbnail",
]

export const adminReservationQueryConfig = {
    list: {
        defaults: defaultAdminReservationFields,
        isList: true,
    },
    retrieve: {
        defaults: defaultAdminReservationFields,
        isList: false,
    },
}

