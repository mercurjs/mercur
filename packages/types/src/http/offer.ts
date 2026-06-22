import { DeleteResponse, PaginatedResponse } from "@medusajs/types"
import {
  CreateOfferInventoryItemDTO,
  CreateOfferPriceDTO,
  OfferDTO,
  UpsertOfferPriceDTO,
} from "../offer"

/*
 * --------------------------------------------------------------------
 * Vendor surface (POST/GET/DELETE under /vendor/offers)
 * --------------------------------------------------------------------
 */

/**
 * Body for `POST /vendor/offers`. `seller_id` and `created_by` are not part
 * of the public payload — they are derived from the authenticated session
 * before the create workflow runs.
 */
export interface VendorCreateOfferReq {
  sku: string
  variant_id: string
  shipping_profile_id: string
  inventory_items: CreateOfferInventoryItemDTO[]
  prices: CreateOfferPriceDTO[]
  metadata?: Record<string, unknown> | null
}

/**
 * Body for `POST /vendor/offers/:id`. Setting `prices` rewrites the offer's
 * `PriceSet` with replace semantics; omit it to leave the ladder untouched.
 */
export interface VendorUpdateOfferReq {
  sku?: string
  shipping_profile_id?: string
  metadata?: Record<string, unknown> | null
  prices?: UpsertOfferPriceDTO[]
}

/**
 * Body for `POST /vendor/offers/:id/inventory-items/batch`. The
 * combination of `create`, `update`, and `delete` is applied in one call;
 * inventory ids are required to be unique across the three buckets.
 */
export interface VendorBatchOfferInventoryItemsReq {
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

export interface VendorOfferResponse {
  offer: OfferDTO
}

export type VendorOfferListResponse = PaginatedResponse<{
  offers: OfferDTO[]
}>

export type VendorOfferDeleteResponse = DeleteResponse<"offer">

/**
 * Response shape of `POST /vendor/offers/:id/inventory-items/batch`. The
 * `created`/`updated`/`deleted` arrays mirror the
 * `AdminProductVariantInventoryBatchResponse` shape; the refetched `offer`
 * is included so the client does not need a follow-up GET.
 */
export interface VendorBatchOfferInventoryItemsResponse {
  created: unknown[]
  updated: unknown[]
  deleted: string[]
  offer: OfferDTO
}

/*
 * --------------------------------------------------------------------
 * Admin surface (read-only as of SPEC-002 Session 7)
 * --------------------------------------------------------------------
 */

export interface AdminOfferResponse {
  offer: OfferDTO
}

export type AdminOfferListResponse = PaginatedResponse<{
  offers: OfferDTO[]
}>
