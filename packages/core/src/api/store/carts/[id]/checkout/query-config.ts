export const defaultStoreRetrieveOrderGroupFields = [
    "id",
    "customer_id",
    "cart_id",
    "seller_count",
    "total",
    "created_at",
    "updated_at",
]

export const storeCheckoutCartQueryConfig = {
    defaults: defaultStoreRetrieveOrderGroupFields,
    isList: false,
}
