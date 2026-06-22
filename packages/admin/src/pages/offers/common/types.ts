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
