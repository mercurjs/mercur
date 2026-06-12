export const OFFERS_PAGE_SIZE = 10
export const OFFER_IDS_KEY = "offer_ids"

export const OFFER_DETAIL_FIELDS = [
  "id",
  "sku",
  "ean",
  "upc",
  "variant_id",
  "seller_id",
  "shipping_profile_id",
  "metadata",
  "created_at",
  "updated_at",
  "deleted_at",
  "product_variant.id",
  "product_variant.title",
  "product_variant.sku",
  "product_variant.product_id",
  "product_variant.product.id",
  "product_variant.product.title",
  "product_variant.product.thumbnail",
  "shipping_profile.id",
  "shipping_profile.name",
  "shipping_profile.type",
  "prices.id",
  "prices.amount",
  "prices.currency_code",
  "prices.min_quantity",
  "prices.max_quantity",
  "prices.rules_count",
  "prices.price_rules.attribute",
  "prices.price_rules.value",
  "inventory_item_link.id",
  "inventory_item_link.required_quantity",
  "inventory_item_link.inventory_item_id",
  "inventory_item_link.inventory_item.id",
  "inventory_item_link.inventory_item.sku",
  "inventory_item_link.inventory_item.title",
  "inventory_item_link.inventory_item.location_levels.id",
  "inventory_item_link.inventory_item.location_levels.location_id",
  "inventory_item_link.inventory_item.location_levels.stocked_quantity",
  "inventory_item_link.inventory_item.location_levels.reserved_quantity",
  "inventory_item_link.inventory_item.location_levels.incoming_quantity",
  "inventory_item_link.inventory_item.location_levels.available_quantity",
].join(",")

/**
 * Fields for the Offer Variant detail page (SPEC-009), keyed by offer
 * id. Extends the offer detail fields with the variant's option values
 * (the General section's per-option rows).
 */
export const OFFER_VARIANT_DETAIL_FIELDS = [
  "id",
  "sku",
  "ean",
  "upc",
  "variant_id",
  "seller_id",
  "shipping_profile_id",
  "metadata",
  "created_at",
  "updated_at",
  "product_variant.id",
  "product_variant.title",
  "product_variant.sku",
  "product_variant.product_id",
  "product_variant.product.id",
  "product_variant.product.title",
  "product_variant.product.thumbnail",
  "product_variant.options.id",
  "product_variant.options.value",
  "product_variant.options.option.id",
  "product_variant.options.option.title",
  "shipping_profile.id",
  "shipping_profile.name",
  "shipping_profile.type",
  "prices.id",
  "prices.amount",
  "prices.currency_code",
  "prices.min_quantity",
  "prices.max_quantity",
  "prices.rules_count",
  "prices.price_rules.attribute",
  "prices.price_rules.value",
  "inventory_item_link.id",
  "inventory_item_link.required_quantity",
  "inventory_item_link.inventory_item_id",
  "inventory_item_link.inventory_item.id",
  "inventory_item_link.inventory_item.sku",
  "inventory_item_link.inventory_item.title",
  "inventory_item_link.inventory_item.location_levels.id",
  "inventory_item_link.inventory_item.location_levels.location_id",
  "inventory_item_link.inventory_item.location_levels.stocked_quantity",
  "inventory_item_link.inventory_item.location_levels.available_quantity",
].join(",")

export const OFFER_LIST_FIELDS = [
  "id",
  "sku",
  "variant_id",
  "seller_id",
  "created_at",
  "updated_at",
  "deleted_at",
  "product_variant.id",
  "product_variant.title",
  "product_variant.product_id",
  "product_variant.product.id",
  "product_variant.product.title",
  "product_variant.product.status",
  "product_variant.product.thumbnail",
  "product_variant.product.categories.id",
  "product_variant.product.categories.name",
  "shipping_profile.id",
  "shipping_profile.name",
].join(",")

/**
 * Fields for the product-backed Offers list (SPEC-009): the vendor
 * product endpoint with the seller's offers wrapped under each variant.
 * Requesting `variants.offers.id` triggers the `withOffers` wrap on the
 * backend; the returned `variant.offers[]` carry the full offer shape.
 * Paired with `has_offer: "true"` to scope to the seller's offered
 * products. `variants.offers.id` also feeds the offered-variant count
 * and the product-level delete (collecting offer ids).
 */
export const OFFER_PRODUCT_LIST_FIELDS = [
  "id",
  "title",
  "handle",
  "status",
  "thumbnail",
  "created_at",
  "updated_at",
  "*collection",
  "categories.id",
  "categories.name",
  "variants.id",
  "variants.offers.id",
].join(",")

/**
 * Fields for the product-shaped offer detail page (SPEC-009): the
 * product's own attributes (Details + Media) plus each variant with the
 * seller's offers wrapped under it (Variants table). `variants.offers.*`
 * triggers the `withOffers` wrap; the returned offers carry sku /
 * prices / shipping profile / inventory-item links.
 */
export const OFFER_PRODUCT_DETAIL_FIELDS = [
  "id",
  "title",
  "subtitle",
  "description",
  "handle",
  "discountable",
  "status",
  "thumbnail",
  "*collection",
  "*images",
  "variants.id",
  "variants.title",
  "variants.sku",
  "variants.options.id",
  "variants.options.value",
  "variants.options.option.id",
  "variants.options.option.title",
  "variants.offers.id",
  "variants.offers.sku",
  "variants.offers.created_at",
  "variants.offers.updated_at",
  "variants.offers.prices.amount",
  "variants.offers.prices.currency_code",
  "variants.offers.shipping_profile.id",
  "variants.offers.shipping_profile.name",
  "variants.offers.inventory_items.id",
  "variants.offers.inventory_items.required_quantity",
].join(",")
