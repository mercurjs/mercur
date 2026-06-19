import type {
  CreateProductDTO as UpstreamCreateProductDTO,
} from "@medusajs/types"
import { AttributeType, ProductChangeStatus } from "./common"

// --- ProductAttributeValue (Mercur-only) ---

export interface CreateProductAttributeValueDTO {
  handle?: string
  name: string
  rank?: number
  is_active?: boolean
  product_option_value_id?: string | null
  metadata?: Record<string, unknown> | null
}

export interface UpdateProductAttributeValueDTO {
  handle?: string
  name?: string
  rank?: number
  is_active?: boolean
  product_option_value_id?: string | null
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
  product_option_id?: string | null
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
  product_option_id?: string | null
  metadata?: Record<string, unknown> | null
}

// --- Batch attribute attach/detach/update on a product (SPEC-014 §G) ---
//
// Mirrors Medusa's global-option input convention (`ProductOptionProductPair`,
// `ProductOptionProductValueUpdate`, `LinkProductOptionsToProductWorkflowInput`):
// documented ref DTOs that drive the
// `createAndLinkProductAttributesToProductWorkflow` engine.

/**
 * A single attribute to attach to a product. You can pass one of the
 * following forms:
 *
 * 1. **Existing select / axis attribute** — `{ id, value_ids }`. Links the
 *    referenced `ProductAttributeValue`s to the product. For a variant-axis
 *    `multi_select` attribute the `value_ids` are the per-product subset of the
 *    mirror `ProductOption`'s values; for a non-axis select they are plain
 *    value links.
 * 2. **Existing text / unit / toggle attribute** — `{ id, value }`. `text` and
 *    `unit` create a new value named `String(value)` and link it; `toggle`
 *    links the existing seeded `"true"` / `"false"` value matching the boolean
 *    (toggle values are never created here).
 * 3. **Inline axis attribute** — `{ title, values, is_variant_axis: true }`.
 *    Creates an exclusive `ProductOption(is_exclusive: true)` on the product, a
 *    product-scoped `ProductAttribute` (`product_id` set), and the value mirror.
 * 4. **Inline non-axis attribute** — `{ title, type, value | values }`. Creates
 *    a product-scoped attribute plus its value(s) and links them. `type` is
 *    required unless it is inferable (`is_variant_axis` ⇒ `multi_select`,
 *    boolean `value` ⇒ `toggle`).
 */
export type ProductAttributeBatchAdd =
  | {
    /** The id of an existing attribute to attach. */
    id: string
    /**
     * The ids of the attribute values to associate with the product
     * (select types) or the per-product subset of a variant axis.
     */
    value_ids?: string[]
    /** A free-form scalar for `text` / `unit` / `toggle` attributes. */
    value?: string | number | boolean
  }
  | {
    /** The name of the inline attribute to create (product-scoped). */
    title: string
    /**
     * The attribute type. Inferred when omitted: `is_variant_axis` ⇒
     * `multi_select`, a boolean `value` ⇒ `toggle`, otherwise `text`.
     */
    type?: AttributeType
    /** The value names to create (axis / multi-value attributes). */
    values?: string[]
    /** A single free-form scalar for `text` / `unit` attributes. */
    value?: string | number | boolean
    /** Whether this inline attribute is a variant axis (`multi_select` only). */
    is_variant_axis?: boolean
    is_filterable?: boolean
    is_required?: boolean
    description?: string | null
    metadata?: Record<string, unknown> | null
  }

/**
 * The details to update one attribute's selection on a product. The meaning of
 * `add` / `remove` / `value` depends on the attribute's type:
 *
 * - **Shared axis** (`multi_select` + `is_variant_axis`, global): `add` /
 *   `remove` are attribute `value_ids` adjusting the per-product value subset of
 *   the mirror option.
 * - **Exclusive / inline axis** (product-scoped): `add` carries new value
 *   objects `{ value }` to create on the exclusive option; `remove` carries the
 *   `product_option_value` ids to drop. The option mirror is kept in sync.
 * - **text / unit / toggle**: `value` is the new scalar — `text`/`unit` create a
 *   new value and swap the product link; `toggle` swaps the linked
 *   `true`/`false` value.
 */
export type ProductAttributeBatchUpdate = {
  /** The id of the existing attribute to update. */
  id: string
  /**
   * A new name for the attribute. Only honoured for product-scoped (inline)
   * attributes — renaming propagates to the mirror `ProductOption`'s title for
   * axis attributes. Ignored for shared/global catalog attributes.
   */
  title?: string
  /**
   * The attribute value ids to add (shared axis subset) or new value objects
   * `{ value }` to create (exclusive axis), mirroring
   * `ProductOptionProductValueUpdate.add`.
   */
  add?: (string | { value: string })[]
  /**
   * The attribute value ids (shared axis) or product option value ids
   * (exclusive axis) to remove.
   */
  remove?: string[]
  /** The new free-form scalar for `text` / `unit` / `toggle` attributes. */
  value?: string | number | boolean
}

/**
 * Input for the attribute batch attach/detach/update engine
 * (`createAndLinkProductAttributesToProductWorkflow`). Applied in the order
 * **remove → add → update** so a same-call remove + re-add of one attribute
 * resolves correctly.
 */
export type ProductAttributeBatchInput = {
  /** The id of the product whose attributes are being managed. */
  product_id: string
  /** The attributes to attach to the product. See {@link ProductAttributeBatchAdd}. */
  add?: ProductAttributeBatchAdd[]
  /**
   * The ids of the attributes to detach from the product. Shared axis →
   * unlink the mirror option; exclusive/scoped → delete the attribute (and its
   * exclusive option); non-axis → drop the value links.
   */
  remove?: string[]
  /** The attribute selections to mutate. See {@link ProductAttributeBatchUpdate}. */
  update?: ProductAttributeBatchUpdate[]
}


// --- Product (Mercur overrides status + adds marketplace fields) ---

export type CreateProductDTO = Omit<UpstreamCreateProductDTO, "options"> & {
  /**
   * Unified product attribute input resolved by the Mercur create-products
   * wrapper into native options / value links. Each entry is one of the
   * {@link ProductAttributeBatchAdd} forms. Variant-axis `multi_select`
   * attributes become native (shared or exclusive) `ProductOption`s that
   * variants bind to via their `options` name-map.
   *
   * Callers do NOT pass native `options`: the wrapper seeds a default option so
   * the product is creatable, and axis attributes add the real options.
   */
  attributes?: ProductAttributeBatchAdd[]
}

// --- ProductChange (Mercur-only) ---

export interface CreateProductChangeDTO {
  product_id: string
  internal_note?: string
  external_note?: string
  created_by?: string
  status?: ProductChangeStatus
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
