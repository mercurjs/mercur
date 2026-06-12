import {
  InventoryItemDTO,
  MoneyAmountDTO,
  ShippingProfileDTO,
} from "@medusajs/types"

import { ProductVariantDTO } from "../product/common"
import { SellerDTO } from "../seller/common"

/**
 * One row on the offer's inventory-item link, resolved through the writable
 * `offer ↔ inventory_item` link defined in
 * `packages/core/src/links/offer-inventory-item-link.ts`. The link table
 * exposes `required_quantity` as an extra column, so the link row is the
 * authoritative source for that field; the joined `inventory` is the underlying
 * Medusa `InventoryItem`.
 */
export interface OfferInventoryItemLinkDTO {
  inventory_item_id: string
  required_quantity: number
  inventory?: InventoryItemDTO
}

/**
 * One row on the offer's price ladder, surfaced through the writable
 * `offer ↔ price` list-link in
 * `packages/core/src/links/offer-price-link.ts`. The offer's prices live on
 * the master variant's shared `PriceSet`, scoped by an `offer_id` `PriceRule`
 * on each row — but the offer-side reads go through the list-link pivot so
 * `offer.prices: Price[]` resolves in a single Query traversal.
 */
export type OfferPriceDTO = MoneyAmountDTO

/**
 * The marketplace's per-vendor sellable. An offer is the thin marketplace-side
 * record that points at a Medusa `ProductVariant` (which owns the shared
 * `PriceSet`) and links to one or more Medusa `InventoryItem` rows. The base
 * columns (`seller_id`, `variant_id`, `shipping_profile_id`, `sku`, `ean`,
 * `upc`, `created_by`, `metadata`) live on the `offer` table; the optional
 * `variant` / `seller` / `shipping_profile` / `prices` / `inventory_items`
 * relations are joined through module links and only present when the
 * consumer requested those fields.
 */
export interface OfferDTO {
  id: string
  seller_id: string
  variant_id: string
  shipping_profile_id: string
  sku: string
  ean: string | null
  upc: string | null
  created_by: string
  metadata: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
  /**
   * Joined through the writable `offer ↔ price` list-link defined in
   * `packages/core/src/links/offer-price-link.ts`. Carries the offer's
   * Price rows on the variant's shared `PriceSet` (filtered by the
   * `offer_id` `PriceRule` Mercur stamps on every offer-owned row).
   */
  prices?: OfferPriceDTO[]
  /**
   * Joined through the writable `offer ↔ inventory_item` link. Each row
   * carries the link's `required_quantity` plus the underlying
   * `InventoryItem` when requested.
   */
  inventory_items?: OfferInventoryItemLinkDTO[]
  /** The seller that owns this offer (joined through `offer ↔ seller`). */
  seller?: SellerDTO
  /** The master variant this offer points at (joined through `offer ↔ variant`). */
  product_variant?: ProductVariantDTO
  /** The offer's shipping profile (joined through `offer ↔ shipping_profile`). */
  shipping_profile?: ShippingProfileDTO
}
