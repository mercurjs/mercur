import { HttpTypes } from "@medusajs/types"
import { OfferDTO } from "@mercurjs/types"

/**
 * A product variant carrying offers, as returned by the admin product
 * endpoint's `withOffers` wrap (SPEC-010). Admin is platform-wide, so each
 * offer carries its `seller` (on `OfferDTO`) to drive the Store column.
 * Composed from the Medusa `AdminProductVariant` DTO + the Mercur `OfferDTO`.
 */
export type OfferProductVariant = HttpTypes.AdminProductVariant & {
  offers?: OfferDTO[] | null
}

/** A product with offers wrapped under each variant (admin Offers surface). */
export type OfferProduct = HttpTypes.AdminProduct & {
  variants?: OfferProductVariant[] | null
}

/**
 * A row on the per-seller grouped admin Offers list: one offer representing a
 * `(product_id, seller_id)` group, with the product/seller links hydrated and
 * the group's offer ids + offered-variant count aggregated by the backend
 * workflow. `id` is the product id (the row's navigation target); `row_id` is
 * the unique table key (`product_id:seller_id`).
 */
export type GroupedOfferRow = {
  id: string
  row_id: string
  product_id: string
  seller_id: string
  offer_ids: string[]
  variant_count: number
  created_at?: string | null
  updated_at?: string | null
  product?: {
    id?: string | null
    title?: string | null
    handle?: string | null
    status?: string | null
    thumbnail?: string | null
    collection?: { id?: string | null; title?: string | null } | null
    categories?: { id?: string | null; name?: string | null }[] | null
  } | null
  seller?: {
    id?: string | null
    name?: string | null
    handle?: string | null
  } | null
}

export type OfferPriceRule = {
  attribute?: string | null
  value?: string | null
}

export type OfferPrice = {
  id?: string
  amount: number
  currency_code: string
  min_quantity?: number | null
  max_quantity?: number | null
  rules_count?: number | null
  price_rules?: OfferPriceRule[] | null
}

export type OfferInventoryItemLink = {
  id?: string
  inventory_item_id: string
  required_quantity?: number | null
  inventory_item?: {
    id: string
    sku?: string | null
    title?: string | null
    location_levels?: {
      id?: string
      location_id?: string
      stocked_quantity?: number | null
      reserved_quantity?: number | null
      incoming_quantity?: number | null
      available_quantity?: number | null
    }[] | null
  } | null
}

export type OfferAuditEntry = {
  at?: string | null
  actor?: string | null
  action?: string | null
  summary?: string | null
}

export type OfferDetail = {
  id: string
  sku?: string | null
  ean?: string | null
  upc?: string | null
  variant_id?: string | null
  seller_id?: string | null
  shipping_profile_id?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string | null
  updated_at?: string | null
  deleted_at?: string | null
  product_variant?: {
    id?: string | null
    title?: string | null
    sku?: string | null
    product_id?: string | null
    product?: {
      id?: string | null
      title?: string | null
      thumbnail?: string | null
      status?: string | null
      categories?: { id?: string | null; name?: string | null }[] | null
    } | null
  } | null
  shipping_profile?: {
    id?: string | null
    name?: string | null
    type?: string | null
  } | null
  prices?: OfferPrice[] | null
  inventory_item_link?: OfferInventoryItemLink[] | null
  seller?: {
    id?: string | null
    name?: string | null
    handle?: string | null
    email?: string | null
  } | null
  audit_log?: OfferAuditEntry[] | null
}
