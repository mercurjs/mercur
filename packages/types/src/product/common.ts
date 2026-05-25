import type {
  ProductDTO as UpstreamProductDTO,
  ProductVariantDTO as UpstreamProductVariantDTO,
  ProductCategoryDTO as UpstreamProductCategoryDTO,
  ProductImageDTO,
} from "@medusajs/types"
import { SellerDTO } from "../seller/common"

// --- Enums ---

/**
 * Mercur product acceptance workflow. Adds `REQUIRES_ACTION` to the
 * upstream `draft / proposed / published / rejected` set.
 */
export enum ProductStatus {
  DRAFT = "draft",
  PROPOSED = "proposed",
  PUBLISHED = "published",
  REQUIRES_ACTION = "requires_action",
  REJECTED = "rejected",
}

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

/** Product change lifecycle statuses. */
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
}

// --- Mercur-only DTOs ---

export interface ProductBrandDTO {
  id: string
  name: string
  handle: string
  is_restricted: boolean
  metadata: Record<string, unknown> | null
  products?: ProductDTO[]
  created_at: string | Date
  updated_at: string | Date
  deleted_at: string | Date | null
}

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
  product_id: string | null
  metadata: Record<string, unknown> | null
  values?: ProductAttributeValueDTO[]
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
export type ProductDTO = Omit<UpstreamProductDTO, "status" | "options"> & {
  status: ProductStatus
  is_restricted: boolean
  created_by: string | null
  created_by_actor: string | null
  variants?: ProductVariantDTO[]
  brand?: ProductBrandDTO | null
  brand_id?: string | null
  categories?: ProductCategoryDTO[]
  variant_attributes?: ProductAttributeDTO[]
  custom_attributes?: ProductAttributeDTO[]
  attribute_values?: ProductAttributeValueDTO[]
  attributes?: ProductAttributeDTO[]
  sellers?: SellerDTO[]
  changes?: ProductChangeDTO[]
}

/**
 * Internal alias of `ProductDTO`. Used by the `.mercur/types.d.ts` shim so
 * consumers writing `import { ProductDTO } from "@medusajs/types"` resolve
 * to the Mercur shape.
 */
export type MercurProductDTO = ProductDTO
