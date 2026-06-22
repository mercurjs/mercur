/**
 * Public, store-facing projection of an offer. A subset of
 * `defaultVendorOfferFields` (no `created_by`), plus the variant's
 * `price_set.id` (needed to resolve `calculated_price`) and the offer's
 * inventory-item link location levels (needed to resolve
 * `inventory_quantity` per sales channel).
 *
 * `calculated_price` and `inventory_quantity` are NOT graph fields — they
 * are computed post-query by the wrap helpers in `./helpers`. Consumers opt
 * in by requesting them via `?fields=...`; the route strips them before the
 * graph read.
 */
export const defaultStoreOfferFields = [
  "id",
  "seller_id",
  "variant_id",
  "product_id",
  "shipping_profile_id",
  "sku",
  "ean",
  "upc",
  "metadata",
  "created_at",
  "updated_at",
  "seller.id",
  "seller.name",
  "seller.handle",
  "product_variant.id",
  "product_variant.title",
  "product_variant.sku",
  "product_variant.price_set.id",
  "shipping_profile.id",
  "shipping_profile.name",
  "prices.id",
  "prices.amount",
  "prices.currency_code",
  "prices.min_quantity",
  "prices.max_quantity",
  "inventory_item_link.id",
  "inventory_item_link.required_quantity",
  "inventory_item_link.inventory_item_id",
  "inventory_item_link.inventory_item.id",
  "inventory_item_link.inventory_item.sku",
  "inventory_item_link.inventory_item.location_levels.id",
  "inventory_item_link.inventory_item.location_levels.location_id",
  "inventory_item_link.inventory_item.location_levels.stocked_quantity",
]

export const storeOfferQueryConfig = {
  list: {
    defaults: defaultStoreOfferFields,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: defaultStoreOfferFields,
    isList: false,
  },
}
