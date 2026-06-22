import type {
  ProductDTO as UpstreamProductDTO,
  ProductVariantDTO as UpstreamProductVariantDTO,
  ProductCategoryDTO as UpstreamProductCategoryDTO,
  ProductImageDTO,
} from "@medusajs/types"
import { SellerDTO } from "../seller/common"

// --- Enums ---


/**
 * Data types for product attributes. Determines validation rules and UI
 * rendering.
 */
export enum AttributeType {
  SINGLE_SELECT = "single_select",
  MULTI_SELECT = "multi_select",
  UNIT = "unit",
  TOGGLE = "toggle",
  TEXT = "text",
}

/**
 * Product change lifecycle statuses. Vendor edits land as `PENDING`
 * (awaiting admin action) and resolve to `CONFIRMED` / `DECLINED` /
 * `CANCELED`. Audit-trail rows (publish approval, change requests)
 * are created already `CONFIRMED`.
 */
export enum ProductChangeStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  DECLINED = "declined",
  CANCELED = "canceled",
}

/**
 * Action types for ProductChangeAction. Each action's `details` JSON carries
 * the operation payload; `ProductModuleService.applyProductChangeActions_`
 * dispatches based on `action`.
 */
export enum ProductChangeActionType {
  STATUS_CHANGE = "STATUS_CHANGE",
  UPDATE = "UPDATE",
  VARIANT_ADD = "VARIANT_ADD",
  VARIANT_UPDATE = "VARIANT_UPDATE",
  VARIANT_REMOVE = "VARIANT_REMOVE",
  ATTRIBUTE_ADD = "ATTRIBUTE_ADD",
  ATTRIBUTE_REMOVE = "ATTRIBUTE_REMOVE",
  PRODUCT_DELETE = "PRODUCT_DELETE",
  /**
   * Operator asked the vendor to revise a submission. Auto-applied
   * (no product mutation) — the parent `ProductChange.external_note`
   * carries the operator's message and the action's existence in the
   * audit trail is the durable signal.
   */
  CHANGE_REQUESTED = "CHANGE_REQUESTED",
}

// --- Mercur-only DTOs ---

export interface ProductAttributeValueDTO {
  id: string
  handle: string | null
  name: string
  rank: number
  is_active: boolean
  metadata: Record<string, unknown> | null
  attribute?: ProductAttributeDTO
  attribute_id?: string
  variants?: ProductVariantDTO[]
  products?: ProductDTO[]
  created_at: string | Date
  updated_at: string | Date
  deleted_at: string | Date | null
}

export interface ProductAttributeDTO {
  id: string
  handle: string | null
  name: string
  description: string | null
  type: AttributeType
  is_required: boolean
  is_filterable: boolean
  is_variant_axis: boolean
  rank: number
  is_active: boolean
  created_by: string | null
  /**
   * Legacy override-only column on the fused Mercur product module. Optional
   * because the new standalone `product-attribute` module (SPEC-008) drops
   * this field — product-scoped attributes are migrated to stock
   * `ProductOption` / `ProductOptionValue` instead. The legacy fused module
   * still populates the column until step 5 retires it.
   */
  product_id?: string | null
  metadata: Record<string, unknown> | null
  values?: ProductAttributeValueDTO[]
  /**
   * Legacy entity-level M:N relations populated by the fused Mercur product
   * module. The new `product-attribute` module exposes these via Module
   * Links instead (`product_attribute_category_link`,
   * `product_variant_attribute`) and the link aliases resolve through
   * Query Graph rather than the service.
   */
  categories?: ProductCategoryDTO[]
  variant_products?: ProductDTO[]
  created_at: string | Date
  updated_at: string | Date
  deleted_at: string | Date | null
}

export interface ProductChangeActionDTO {
  id: string
  product_id: string
  product_change_id: string | null
  ordering: number
  action: string
  details: Record<string, unknown>
  internal_note: string | null
  applied: boolean
  product_change?: ProductChangeDTO
  created_at: string | Date
  updated_at: string | Date
  deleted_at: string | Date | null
}

export interface ProductChangeDTO {
  id: string
  product?: ProductDTO
  product_id?: string
  status: ProductChangeStatus
  internal_note: string | null
  external_note: string | null
  created_by: string | null
  confirmed_by: string | null
  confirmed_at: string | Date | null
  declined_by: string | null
  declined_at: string | Date | null
  declined_reason: string | null
  canceled_by: string | null
  canceled_at: string | Date | null
  metadata: Record<string, unknown> | null
  actions?: ProductChangeActionDTO[]
  created_at: string | Date
  updated_at: string | Date
  deleted_at: string | Date | null
}

// --- Mercur-extended DTOs (Omit + intersection over upstream) ---

/**
 * Mercur extends `ProductCategoryDTO` with `is_restricted`. Pure addition,
 * no field conflicts.
 */
export type ProductCategoryDTO = UpstreamProductCategoryDTO & {
  is_restricted: boolean
  attributes?: ProductAttributeDTO[]
}

/**
 * Mercur extends `ProductVariantDTO` with `attribute_values` and Mercur's
 * own `images` link. Upstream fields kept intact.
 */
export type ProductVariantDTO = UpstreamProductVariantDTO & {
  attribute_values?: ProductAttributeValueDTO[]
  images?: ProductImageDTO[]
}

/**
 * Mercur's `ProductDTO`. Replaces `status` (Mercur enum includes
 * `REQUIRES_ACTION`) and drops `options`. Adds marketplace-only fields.
 */
export type ProductDTO = UpstreamProductDTO & {
  variants?: ProductVariantDTO[]
  categories?: ProductCategoryDTO[]
  variant_attributes?: ProductAttributeDTO[]
  custom_attributes?: ProductAttributeDTO[]
  attribute_values?: ProductAttributeValueDTO[]
  attributes?: ProductAttributeDTO[]
  sellers?: SellerDTO[]
  changes?: ProductChangeDTO[]
}
