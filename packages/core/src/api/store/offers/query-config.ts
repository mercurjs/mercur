import { buildAllowedFields } from "@medusajs/medusa/api/store/utils/allowed-fields"

export const defaultStoreOfferFields = [
  "id",
  "seller_id",
  "variant_id",
  "product_id",
  "shipping_profile_id",
  "sku",
  "ean",
  "upc",
  "leadtime_to_ship",
  "effective_leadtime_to_ship",
  "condition_id",
  "metadata",
  "created_at",
  "updated_at",
  "condition.id",
  "condition.code",
  "condition.label",
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
  "inventory_item_link.inventory_item.location_levels.reserved_quantity",
]

const computedStoreOfferFields = [
  "calculated_price",
  "inventory_quantity",
  "in_stock",
  "effective_leadtime_to_ship",
]

export const allowedStoreOfferExtraFields = [
  ...computedStoreOfferFields,
  "condition.description",
  "seller.description",
  "seller.logo",
  "seller.banner",
  "seller.is_premium",
  "seller.default_leadtime_to_ship",
  "seller.closed_from",
  "seller.closed_to",
  "seller.closure_note",
  "product.id",
  "product.title",
  "product.subtitle",
  "product.handle",
  "product.thumbnail",
  "product.status",
  "product_variant.barcode",
  "product_variant.ean",
  "product_variant.upc",
  "product_variant.product_id",
  "product_variant.options",
  "product_variant.options.id",
  "product_variant.options.value",
  "shipping_profile.type",
  "prices.price_set_id",
  "prices.rules_count",
]

export const allowedStoreOfferFields = buildAllowedFields(
  defaultStoreOfferFields,
  allowedStoreOfferExtraFields
)

export const storeOfferQueryConfig = {
  list: {
    defaults: defaultStoreOfferFields,
    allowed: allowedStoreOfferFields,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: defaultStoreOfferFields,
    allowed: allowedStoreOfferFields,
    isList: false,
  },
}
