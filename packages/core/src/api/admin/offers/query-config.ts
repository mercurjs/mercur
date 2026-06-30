export const defaultAdminOfferFields = [
  "id",
  "seller_id",
  "variant_id",
  "product_id",
  "shipping_profile_id",
  "sku",
  "ean",
  "upc",
  "created_by",
  "metadata",
  "created_at",
  "updated_at",
  "deleted_at",
  "seller.id",
  "seller.name",
  "seller.handle",
  "product_variant.id",
  "product_variant.title",
  "product_variant.sku",
  "shipping_profile.id",
  "shipping_profile.name",
  "prices.id",
  "prices.amount",
  "prices.currency_code",
  "prices.min_quantity",
  "prices.max_quantity",
  "prices.price_rules.attribute",
  "prices.price_rules.value",
  "inventory_items.inventory_item_id",
  "inventory_items.required_quantity",
  "inventory_items.id",
  "inventory_items.sku",
]

/**
 * Fields for the per-seller grouped offers list. Each row is one offer
 * representing a `(product_id, seller_id)` group; the product / seller links
 * hydrate from the row's foreign keys (`offer_ids` / `variant_count` are added
 * by the workflow, not read from the graph).
 */
export const groupedAdminOfferFields = [
  "id",
  "product_id",
  "seller_id",
  "variant_id",
  "created_at",
  "updated_at",
  "product.id",
  "product.title",
  "product.handle",
  "product.status",
  "product.thumbnail",
  "product.collection.id",
  "product.collection.title",
  "product.categories.id",
  "product.categories.name",
  "seller.id",
  "seller.name",
  "seller.handle",
]

export const adminOfferQueryConfig = {
  list: {
    defaults: defaultAdminOfferFields,
    isList: true,
  },
  retrieve: {
    defaults: defaultAdminOfferFields,
    isList: false,
  },
}
