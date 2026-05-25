import type {
  CreateProductDTO as UpstreamCreateProductDTO,
  UpdateProductDTO as UpstreamUpdateProductDTO,
  CreateProductVariantDTO as UpstreamCreateProductVariantDTO,
  UpdateProductVariantDTO as UpstreamUpdateProductVariantDTO,
  CreateProductCategoryDTO as UpstreamCreateProductCategoryDTO,
  UpdateProductCategoryDTO as UpstreamUpdateProductCategoryDTO,
} from "@medusajs/types"
import { AttributeType, ProductStatus } from "./common"

// --- ProductBrand (Mercur-only) ---

export interface CreateProductBrandDTO {
  name: string
  handle?: string
  is_restricted?: boolean
  metadata?: Record<string, unknown> | null
}

export interface UpdateProductBrandDTO {
  name?: string
  handle?: string
  is_restricted?: boolean
  metadata?: Record<string, unknown> | null
}

// --- ProductAttributeValue (Mercur-only) ---

export interface CreateProductAttributeValueDTO {
  handle?: string
  name: string
  rank?: number
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

export interface UpdateProductAttributeValueDTO {
  handle?: string
  name?: string
  rank?: number
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

export interface UpsertProductAttributeValueDTO
  extends UpdateProductAttributeValueDTO {
  id?: string
}

// --- ProductAttribute (Mercur-only) ---

export interface CreateProductAttributeDTO {
  handle?: string
  name: string
  description?: string | null
  type: AttributeType
  is_required?: boolean
  is_filterable?: boolean
  is_variant_axis?: boolean
  rank?: number
  is_active?: boolean
  created_by?: string | null
  product_id?: string | null
  metadata?: Record<string, unknown> | null
  values?: CreateProductAttributeValueDTO[]
}

export interface UpdateProductAttributeDTO {
  handle?: string
  name?: string
  description?: string | null
  type?: AttributeType
  is_required?: boolean
  is_filterable?: boolean
  is_variant_axis?: boolean
  rank?: number
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

/**
 * Inline input for product attributes. Each entry is either:
 *
 * 1. A global attribute reference: `{ attribute_id, value_ids?: [...] }`
 *    Links an existing ProductAttribute. Use `value_ids` for known IDs,
 *    or `values` (names) to upsert values on the attribute.
 *
 * 2. An inline custom attribute: `{ name, type, values: ["Red", "Blue"] }`
 *    Creates a new ProductAttribute with `product_id` set (scoped to product).
 */
export type ProductAttributeInputDTO =
  | {
      attribute_id: string
      value_ids?: string[]
      values?: string[]
    }
  | {
      name: string
      type: AttributeType
      values?: string[]
      is_variant_axis?: boolean
      is_filterable?: boolean
      is_required?: boolean
      description?: string | null
      metadata?: Record<string, unknown> | null
    }

// --- ProductCategory (Mercur extends with is_restricted) ---

export type CreateProductCategoryDTO = UpstreamCreateProductCategoryDTO & {
  is_restricted?: boolean
}

export type UpdateProductCategoryDTO = UpstreamUpdateProductCategoryDTO & {
  is_restricted?: boolean
}

// --- ProductVariant (Mercur extends with attribute_values) ---

/**
 * `attribute_values` accepts either:
 * - An array of `ProductAttributeValue` IDs (already resolved).
 * - A map of attribute key (attribute `handle` or `name`) to value name(s),
 *   resolved to IDs by the service against the parent product's variant
 *   attributes.
 *
 * @example `["pattrval_red", "pattrval_small"]`
 * @example `{ Color: "Red", Size: ["S", "M"] }`
 */
type VariantAttributeValuesInput = string[] | Record<string, string | string[]>

export type CreateProductVariantDTO = UpstreamCreateProductVariantDTO & {
  attribute_values?: VariantAttributeValuesInput
}

export type UpdateProductVariantDTO = UpstreamUpdateProductVariantDTO & {
  attribute_values?: VariantAttributeValuesInput
}

export type UpsertProductVariantDTO = UpdateProductVariantDTO & {
  id?: string
  title: string
}

// --- Product (Mercur overrides status + adds marketplace fields) ---

export type CreateProductDTO = Omit<UpstreamCreateProductDTO, "status"> & {
  status?: ProductStatus
  is_restricted?: boolean
  created_by?: string | null
  created_by_actor?: string | null
  brand_id?: string | null
  variants?: CreateProductVariantDTO[]
  /**
   * Product variant attributes. Each entry is either:
   * - A global attribute reference: `{ attribute_id, value_ids: ["pattrval_..."] }`
   * - An inline custom attribute: `{ name, type, values: ["Red", "Blue"] }`
   */
  variant_attributes?: ProductAttributeInputDTO[]
  /**
   * Non-variant product-level attributes. Same format as variant_attributes.
   * Creates product-scoped attributes and links their values to the product.
   */
  product_attributes?: ProductAttributeInputDTO[]
}

export type UpdateProductDTO = Omit<UpstreamUpdateProductDTO, "status"> & {
  status?: ProductStatus
  is_restricted?: boolean
  brand_id?: string | null
  variants?: UpsertProductVariantDTO[]
  /** See {@link CreateProductDTO.variant_attributes}. */
  variant_attributes?: ProductAttributeInputDTO[]
  /** See {@link CreateProductDTO.product_attributes}. */
  product_attributes?: ProductAttributeInputDTO[]
}

export type UpsertProductDTO = UpdateProductDTO & {
  id?: string
  title: string
}

// --- ProductChange (Mercur-only) ---

export interface CreateProductChangeDTO {
  product_id: string
  internal_note?: string
  external_note?: string
  created_by?: string
  status?: string
  confirmed_by?: string
  confirmed_at?: Date
  metadata?: Record<string, unknown>
}

export interface CreateProductChangeActionDTO {
  product_change_id?: string
  product_id: string
  action: string
  details?: Record<string, unknown>
  internal_note?: string
  applied?: boolean
}
