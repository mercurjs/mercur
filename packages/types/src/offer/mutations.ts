/**
 * Mutation contracts for the offer module + workflows. Shared between
 * `packages/core/src/workflows/offer/{steps,workflows}` and the HTTP
 * validators / route handlers that drive them. Mirrors the shape Medusa's
 * own product/pricing workflows use so external consumers (block packages,
 * the typed `@mercurjs/client`) can target the same DTOs.
 */

/**
 * One inventory-item link attached to a new offer. `required_quantity`
 * defaults to `1` on persistence.
 */
export interface CreateOfferInventoryItemDTO {
  inventory_item_id: string
  required_quantity?: number
}

/**
 * One row on a new offer's price ladder. Identical in shape to Medusa's
 * `CreatePriceDTO` so it can be threaded into `createPriceSetsStep` without
 * a re-projection.
 */
export interface CreateOfferPriceDTO {
  amount: number
  currency_code: string
  min_quantity?: number | null
  max_quantity?: number | null
  rules?: Record<string, string>
}

/**
 * One row on an existing offer's price ladder when updating. `id` is set for
 * rows that should be updated in place; rows without `id` are added; existing
 * rows omitted from the array are deleted (replace semantics, mirroring
 * Medusa's `updateProductVariantsWorkflow` → `updatePriceSetsStep`).
 */
export interface UpsertOfferPriceDTO extends CreateOfferPriceDTO {
  id?: string
}

/**
 * Inline inventory item to create together with the offer. Mirrors the
 * `location_levels` shape `createInventoryItemsWorkflow` accepts so the
 * inventory item, its location levels, and the offer↔item link can be
 * produced from a single workflow run.
 */
export interface CreateOfferInlineInventoryItemDTO {
  title?: string
  required_quantity?: number
  stock_levels?: Array<{
    location_id: string
    stocked_quantity: number
  }>
}

/**
 * Input to `createOffersWorkflow`. `seller_id` and `created_by` are stamped
 * by the route handler from the authenticated session and are not part of
 * the public HTTP body.
 *
 * Provide `inventory_items` to link existing inventory items, or
 * `inline_inventory_item` to create a new one (with optional starting
 * stock levels) and link it in the same workflow.
 */
export interface CreateOfferDTO {
  seller_id: string
  created_by: string
  sku: string
  variant_id: string
  shipping_profile_id: string
  inventory_items?: CreateOfferInventoryItemDTO[]
  inline_inventory_item?: CreateOfferInlineInventoryItemDTO
  prices: CreateOfferPriceDTO[]
  ean?: string | null
  upc?: string | null
  metadata?: Record<string, unknown> | null
}

/**
 * Persisted offer-row input — the projection that
 * `createOffersWorkflow` hands to `createOffersStep` after seeding the
 * `PriceSet`. `ean` / `upc` are snapshotted off the linked
 * `ProductVariant`.
 */
export interface CreateOfferRowDTO {
  seller_id: string
  variant_id: string
  shipping_profile_id: string
  price_set_id: string
  sku: string
  ean: string | null
  upc: string | null
  created_by: string
  metadata?: Record<string, unknown> | null
}

/**
 * Input to `updateOffersWorkflow`. Each entry is keyed by `id`; setting the
 * `prices` field rewrites the offer's `PriceSet` with replace semantics,
 * omitting it leaves the price ladder untouched. Offer-row fields
 * (`sku`, `shipping_profile_id`, `metadata`) are partial.
 */
export interface UpdateOfferDTO {
  id: string
  sku?: string
  shipping_profile_id?: string
  metadata?: Record<string, unknown> | null
  prices?: UpsertOfferPriceDTO[]
}

/**
 * Input to `batchOfferInventoryItemsWorkflow`. Mirrors the shape Medusa's
 * own inventory-batch endpoints use. Items in `update` and `delete` must
 * already be linked to the offer; items in `create` must not.
 */
export interface BatchOfferInventoryItemsDTO {
  offer_id: string
  create?: Array<{
    inventory_item_id: string
    required_quantity?: number
  }>
  update?: Array<{
    inventory_item_id: string
    required_quantity: number
  }>
  delete?: string[]
}
