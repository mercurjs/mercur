export const defaultStoreRetrieveOrderGroupFields = [
    "id",
    "customer_id",
    "cart_id",
    "seller_count",
    "total",
    "created_at",
    "updated_at",
    "orders.id",
    "orders.display_id",
    "orders.status",
    "orders.seller.id",
    "orders.seller.name",
]

// Store requests strip the `orders` relation unless the route allows it explicitly; the
// curated list is allowed as is, so the seller's private details stay out of reach.
export const storeCompleteCartQueryConfig = {
    defaults: defaultStoreRetrieveOrderGroupFields,
    allowed: defaultStoreRetrieveOrderGroupFields,
    isList: false,
}
