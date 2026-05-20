import { InventoryItemDTO, MoneyAmountDTO, PriceSetDTO } from "@medusajs/types"

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
 * One row on the offer's price ladder, surfaced through the read-only
 * `offer ↔ price_set` link in
 * `packages/core/src/links/offer-price-set-link.ts`. The offer owns one
 * `PriceSet`, and its prices behave like Medusa `MoneyAmount` rows — Mercur
 * does not introduce its own price entity.
 */
export type OfferPriceDTO = MoneyAmountDTO

/**
 * The marketplace's per-vendor sellable. An offer is the thin marketplace-side
 * record that points at a Medusa `ProductVariant`, owns a Medusa `PriceSet`,
 * and links to one or more Medusa `InventoryItem` rows. The base columns
 * (`seller_id`, `variant_id`, `shipping_profile_id`, `price_set_id`,
 * `sku`, `ean`, `upc`, `created_by`, `metadata`) live on the `offer` table;
 * the optional `variant` / `seller` / `shipping_profile` / `price_set` /
 * `inventory_items` relations are joined through module links and only
 * present when the consumer requested those fields.
 */
export interface OfferDTO {
  id: string
  seller_id: string
  variant_id: string
  shipping_profile_id: string
  price_set_id: string
  sku: string
  ean: string | null
  upc: string | null
  created_by: string
  metadata: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
  /**
   * Joined through `offer-price-set-link.ts`. Carries the offer's full price
   * ladder when the field is requested.
   */
  price_set?: PriceSetDTO
  /**
   * Joined through the writable `offer ↔ inventory_item` link. Each row
   * carries the link's `required_quantity` plus the underlying
   * `InventoryItem` when requested.
   */
  inventory_items?: OfferInventoryItemLinkDTO[]
}
